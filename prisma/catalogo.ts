import 'dotenv/config'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../src/generated/prisma/client'
import { CHIAVI_CATEGORIE } from '../src/lib/categorie'
import { trovaImmagini } from './immagini'

// Carica il catalogo degli esercizi dal file prisma/dati/catalogo-esercizi.json nella tabella CatalogoEsercizio. Si può
// rilanciare quante volte si vuole: le righe già presenti (stesso slug) si aggiornano, quelle nuove si aggiungono, e non
// si cancella mai niente, perché gli esercizi delle persone puntano al catalogo. Si lancia così:
//   npm run db:catalogo
//
// Il numero (id) di ogni esercizio sta nel file, non nel database: così è lo stesso in sviluppo e in produzione, ed è quello
// che si usa per nominare le immagini. Se nel database un esercizio ha un numero diverso da quello del file (per esempio
// perché se n'è inserito uno in mezzo), lo script lo cambia: gli esercizi delle persone lo seguono da soli, perché la chiave
// esterna si aggiorna a cascata. Alla fine rimette a posto il contatore dei numeri.
//
// Alla fine collega al catalogo gli esercizi delle persone che non lo sono ancora, se il loro nome coincide con il nome
// italiano o con il nome inglese di una voce del catalogo (senza badare alle maiuscole). L'esercizio prende il nome
// e la categoria del catalogo. Le
// serie già registrate e le voci della scheda restano agganciate allo stesso esercizio, quindi storico e progressi non
// cambiano: cambia solo il nome. Quello che non si riconosce resta com'è e viene elencato alla fine.
//
// Per sostituire un esercizio con un altro sullo stesso numero basta cambiarlo nel file (nuovo slug, stesso id): la riga
// vecchia si toglie, ma solo se nessuna persona la usa; altrimenti lo script si ferma e lo dice.
//
// Un esercizio già collegato si tocca in due casi soltanto. Se il suo nome è quello di un'altra voce, il collegamento è
// finito sul numero sbagliato (capita se nel database si sostituisce a mano il contenuto di una riga senza spostare chi
// la usa) e lo script lo sposta sulla voce giusta. E poi tutti gli esercizi collegati riprendono il nome e la categoria
// attuali della loro voce, così una correzione nel file arriva anche alle schede.
//
// Per vedere cosa cambierebbe senza scrivere niente: PROVA=1 npm run db:catalogo (in PowerShell: $env:PROVA="1"; npm.cmd
// run db:catalogo). Fa tutto dentro una transazione e alla fine la annulla.
//
// Per le immagini: ogni esercizio ha la sua in public/esercizi, con il numero e lo slug (35_push-up.jpg, anche .png o
// .webp; vanno bene anche push-up.jpg e 35.jpg). Lo script le ritrova da solo: basta mettere il file nella cartella e
// rilanciarlo. Chi non ha il file resta senza immagine, e se si toglie un file l'immagine sparisce dal database al lancio
// successivo. Un file con un nome che non è di nessun esercizio, o due file per lo stesso esercizio, vengono segnalati.

const connectionString = process.env.DATABASE_URL
if (!connectionString) throw new Error('DATABASE_URL non è impostata: crea il file .env')

const SOLO_PROVA = process.env.PROVA === '1'

type Voce = {
  id: number
  slug: string
  nomeIt: string
  nomeEn: string
  categoria: string
  attrezzatura: string
  muscoloPrincipale: string
  muscoliSecondari: string
  tipoMovimento: string
  immagine?: string | null
  esecuzione?: string | null
  accortezze?: string | null
}

const voci = JSON.parse(readFileSync(new URL('./dati/catalogo-esercizi.json', import.meta.url), 'utf8')) as Voce[]
const chiave = (testo: string) => testo.trim().toLowerCase()

// Il file è la fonte di verità: se è sbagliato ci si ferma prima di toccare il database.
const problemi: string[] = []
const slug = new Set<string>()
const numeri = new Set<number>()
const nomiUsati = new Map<string, string>()
for (const voce of voci) {
  const dove = voce.nomeIt || voce.slug || '(senza nome)'
  if (!Number.isInteger(voce.id) || voce.id < 1 || voce.id > 2_000_000_000) problemi.push(`${dove}: numero (id) non valido`)
  else if (numeri.has(voce.id)) problemi.push(`${dove}: il numero ${voce.id} è già di un altro esercizio`)
  numeri.add(voce.id)
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(voce.slug)) problemi.push(`${dove}: slug non valido`)
  if (!voce.nomeIt?.trim() || voce.nomeIt.length > 60) problemi.push(`${dove}: nome italiano vuoto o più lungo di 60`)
  if (!voce.nomeEn?.trim()) problemi.push(`${dove}: nome inglese vuoto`)
  if (!(CHIAVI_CATEGORIE as string[]).includes(voce.categoria)) problemi.push(`${dove}: categoria "${voce.categoria}" sconosciuta`)
  for (const campo of ['attrezzatura', 'muscoloPrincipale', 'tipoMovimento'] as const) {
    if (!voce[campo]?.trim()) problemi.push(`${dove}: ${campo} vuoto`)
  }
  if (!voce.esecuzione?.trim() || !voce.accortezze?.trim()) problemi.push(`${dove}: mancano esecuzione o accortezze`)
  if (slug.has(voce.slug)) problemi.push(`${dove}: slug ripetuto`)
  slug.add(voce.slug)
  // Un nome (italiano o inglese) non può servire a due voci: il collegamento per nome sarebbe ambiguo.
  for (const nome of [voce.nomeIt, voce.nomeEn]) {
    const k = chiave(nome)
    const altro = nomiUsati.get(k)
    if (altro && altro !== voce.slug) problemi.push(`${dove}: il nome "${nome}" è già usato da ${altro}`)
    nomiUsati.set(k, voce.slug)
  }
}
if (problemi.length > 0) {
  console.error(`Il catalogo ha ${problemi.length} problemi, non carico niente:\n- ${problemi.join('\n- ')}`)
  process.exit(1)
}

const immagini = trovaImmagini(
  fileURLToPath(new URL('../public/esercizi', import.meta.url)),
  voci.map((voce) => ({ id: voce.id, slug: voce.slug })),
)
if (immagini.doppie.length > 0) {
  console.error(`Ci sono due file per lo stesso esercizio, tienine uno solo. Non carico niente:\n- ${immagini.doppie.join('\n- ')}`)
  process.exit(1)
}

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString }) })

class Annullato extends Error {}

async function main() {
  const prima = await db.catalogoEsercizio.count()
  let legati = 0
  let ricollegati = 0
  let spostati = 0
  let sostituiti: string[] = []
  const cambi: string[] = []
  const sincronizzati: string[] = []
  const restano: string[] = []

  try {
    await db.$transaction(
      async (tx) => {
        // 1. I numeri: ogni esercizio già nel database prende quello del file. Si fa in due passaggi (prima negativi, poi
        // quelli giusti) perché il numero è una chiave unica e un esercizio non può prendere un numero ancora occupato.
        const presenti = await tx.catalogoEsercizio.findMany({ select: { id: true, slug: true } })
        const numeroDi = new Map(presenti.map((riga) => [riga.slug, riga.id]))
        const slugNelFile = new Set(voci.map((voce) => voce.slug))
        const numeriDelFile = new Set(voci.map((voce) => voce.id))
        // Un esercizio può essere sostituito da un altro sullo stesso numero (nel file cambia lo slug ma l'id resta). Se
        // nessuna persona ha quell'esercizio nella scheda o nello storico, la riga vecchia si toglie e al suo posto nasce
        // quella nuova. Se qualcuno lo usa ci si ferma: cambiarne il contenuto cambierebbe il senso delle sue schede.
        const bloccati = presenti.filter((riga) => !slugNelFile.has(riga.slug) && numeriDelFile.has(riga.id))
        if (bloccati.length > 0) {
          const inUso = await tx.esercizio.findMany({
            where: { catalogoId: { in: bloccati.map((riga) => riga.id) } },
            select: { catalogoId: true, nome: true, user: { select: { username: true } } },
          })
          if (inUso.length > 0) {
            throw new Error(
              `Questi esercizi non sono più nel file ma qualcuno li usa: ${inUso.map((e) => `${e.nome} (${e.user.username}, voce ${e.catalogoId})`).join(', ')}. Non cambio niente: togli prima l'esercizio dalla scheda oppure ridai al file lo stesso slug.`,
            )
          }
          await tx.catalogoEsercizio.deleteMany({ where: { id: { in: bloccati.map((riga) => riga.id) } } })
          sostituiti = bloccati.map((riga) => `${riga.id}: ${riga.slug}`)
        }
        const daSpostare = voci.filter((voce) => numeroDi.has(voce.slug) && numeroDi.get(voce.slug) !== voce.id)
        for (const voce of daSpostare) {
          const vecchio = numeroDi.get(voce.slug)!
          await tx.$executeRaw`UPDATE "CatalogoEsercizio" SET id = ${-vecchio}::int WHERE id = ${vecchio}::int`
        }
        for (const voce of daSpostare) {
          const vecchio = numeroDi.get(voce.slug)!
          await tx.$executeRaw`UPDATE "CatalogoEsercizio" SET id = ${voce.id}::int WHERE id = ${-vecchio}::int`
        }
        spostati = daSpostare.length

        // 2. Le righe: quelle nuove nascono con il numero del file, le altre si aggiornano.
        for (const voce of voci) {
          const dati = {
            nomeIt: voce.nomeIt.trim(),
            nomeEn: voce.nomeEn.trim(),
            categoria: voce.categoria,
            attrezzatura: voce.attrezzatura.trim(),
            muscoloPrincipale: voce.muscoloPrincipale.trim(),
            muscoliSecondari: (voce.muscoliSecondari ?? '').trim(),
            tipoMovimento: voce.tipoMovimento.trim(),
            immagine: immagini.perSlug.get(voce.slug) ?? null,
            esecuzione: voce.esecuzione?.trim() ? voce.esecuzione.trim() : null,
            accortezze: voce.accortezze?.trim() ? voce.accortezze.trim() : null,
          }
          await tx.catalogoEsercizio.upsert({
            where: { slug: voce.slug },
            create: { id: voce.id, slug: voce.slug, ...dati },
            update: dati,
          })
        }

        // 3. Il collegamento degli esercizi delle persone. Per ogni nome (italiano, inglese) la riga del catalogo a cui appartiene.
        const righe = await tx.catalogoEsercizio.findMany({ select: { id: true, slug: true, nomeIt: true, categoria: true } })
        const perSlug = new Map(righe.map((riga) => [riga.slug, riga]))
        const perNome = new Map<string, (typeof righe)[number]>()
        for (const voce of voci) {
          const riga = perSlug.get(voce.slug)!
          for (const nome of [voce.nomeIt, voce.nomeEn]) perNome.set(chiave(nome), riga)
        }

        // I nomi della voce a cui un esercizio è collegato: servono a riconoscere un collegamento finito su una voce sbagliata
        // (per esempio perché i numeri del catalogo sono stati cambiati a mano nel database).
        const nomiDellaVoce = new Map<number, Set<string>>()
        for (const voce of voci) {
          nomiDellaVoce.set(
            perSlug.get(voce.slug)!.id,
            new Set([voce.nomeIt, voce.nomeEn].map(chiave)),
          )
        }

        const esercizi = await tx.esercizio.findMany({
          select: { id: true, userId: true, nome: true, catalogoId: true, user: { select: { username: true } } },
          orderBy: [{ userId: 'asc' }, { id: 'asc' }],
        })
        for (const esercizio of esercizi) {
          const riga = perNome.get(chiave(esercizio.nome))
          const chi = esercizio.user.username

          if (esercizio.catalogoId !== null) {
            // Già collegato. Se il suo nome è uno dei nomi della voce a cui punta è tutto a posto; se invece è il nome di
            // un'altra voce, il collegamento è finito sul numero sbagliato e si sposta sulla voce giusta.
            if (nomiDellaVoce.get(esercizio.catalogoId)?.has(chiave(esercizio.nome))) continue
            if (!riga || riga.id === esercizio.catalogoId) continue
            if ((await tx.esercizio.count({ where: { userId: esercizio.userId, catalogoId: riga.id } })) > 0) {
              restano.push(`${chi}: "${esercizio.nome}" è collegato a una voce con un altro nome, ma la persona ha già "${riga.nomeIt}"`)
              continue
            }
            await tx.esercizio.update({
              where: { id: esercizio.id },
              data: { catalogoId: riga.id, categoria: riga.categoria, nome: riga.nomeIt },
            })
            ricollegati += 1
            cambi.push(`${chi}: "${esercizio.nome}" era collegato alla voce ${esercizio.catalogoId}, ora alla ${riga.id} "${riga.nomeIt}" [${riga.categoria}]`)
            continue
          }

          if (!riga) {
            restano.push(`${chi}: "${esercizio.nome}"`)
            continue
          }
          // Una persona non può avere due esercizi collegati allo stesso del catalogo (vincolo): se c'è già, si salta.
          if ((await tx.esercizio.count({ where: { userId: esercizio.userId, catalogoId: riga.id } })) > 0) {
            restano.push(`${chi}: "${esercizio.nome}" (la persona ha già "${riga.nomeIt}")`)
            continue
          }
          await tx.esercizio.update({
            where: { id: esercizio.id },
            data: { catalogoId: riga.id, categoria: riga.categoria, nome: riga.nomeIt },
          })
          legati += 1
          cambi.push(`${chi}: "${esercizio.nome}"${esercizio.nome === riga.nomeIt ? ' (nome già uguale)' : ` -> "${riga.nomeIt}"`} [${riga.categoria}]`)
        }

        // 4. Gli esercizi collegati prendono il nome e la categoria attuali della loro voce: se nel file si corregge un nome o
        // si sposta una voce di categoria, la scheda lo segue. Le serie e le voci della scheda non cambiano.
        const aggiornati = await tx.$queryRaw<{ nome: string; categoria: string }[]>`
          UPDATE "Esercizio" e
          SET nome = c."nomeIt", categoria = c.categoria
          FROM "CatalogoEsercizio" c
          WHERE e."catalogoId" = c.id AND (e.nome <> c."nomeIt" OR e.categoria <> c.categoria)
          RETURNING e.nome AS nome, e.categoria AS categoria`
        for (const riga of aggiornati) sincronizzati.push(`"${riga.nome}" [${riga.categoria}]`)

        if (SOLO_PROVA) throw new Annullato()
      },
      { timeout: 60_000 },
    )
  } catch (errore) {
    if (!(errore instanceof Annullato)) throw errore
  }

  // Il contatore dei numeri riparte dal più alto: il prossimo esercizio inserito senza numero non urta quelli del file. Non
  // si fa in prova, perché questo comando non si può annullare con la transazione.
  if (!SOLO_PROVA) {
    await db.$executeRaw`SELECT setval(pg_get_serial_sequence('"CatalogoEsercizio"', 'id'), (SELECT max(id) FROM "CatalogoEsercizio"))`
  }

  const dopo = await db.catalogoEsercizio.count()
  console.log(SOLO_PROVA ? '*** PROVA: non è stato scritto niente (transazione annullata) ***\n' : '')
  console.log(`Numeri (id) cambiati per allinearli al file: ${spostati}`)
  console.log(`Esercizi sostituiti da un altro sullo stesso numero: ${sostituiti.length}`)
  for (const riga of sostituiti) console.log(`  tolto ${riga}`)
  console.log(`Esercizi delle persone collegati al catalogo: ${legati}`)
  console.log(`Esercizi spostati su un'altra voce perché il collegamento era sbagliato: ${ricollegati}`)
  for (const riga of cambi) console.log(`  ${riga}`)
  console.log(`Esercizi che hanno preso il nome o la categoria attuali della loro voce: ${sincronizzati.length}`)
  for (const riga of sincronizzati) console.log(`  ${riga}`)
  if (restano.length > 0) {
    console.log(`\nNon riconosciuti, restano personali: ${restano.length}`)
    for (const riga of restano) console.log(`  ${riga}`)
  }
  console.log(`\nImmagini trovate in public/esercizi: ${immagini.perSlug.size} su ${voci.length} esercizi.`)
  if (immagini.senzaEsercizio.length > 0) {
    console.log(`File che non corrispondono a nessun esercizio (controlla il nome): ${immagini.senzaEsercizio.length}`)
    for (const file of immagini.senzaEsercizio) console.log(`  ${file}`)
  }
  if (immagini.numeroDiverso.length > 0) {
    console.log(`File col numero sbagliato (usati lo stesso, ma conviene rinominarli): ${immagini.numeroDiverso.length}`)
    for (const riga of immagini.numeroDiverso) console.log(`  ${riga}`)
  }
  console.log(
    `\nCatalogo: ${voci.length} esercizi nel file, ${prima} nel database prima, ${SOLO_PROVA ? prima : dopo} dopo` +
      `${SOLO_PROVA ? ` (in prova: ${voci.length - prima > 0 ? voci.length - prima : 0} nuovi)` : ` (${dopo - prima} nuovi)`}.`,
  )
}

main()
  .catch((errore: unknown) => {
    console.error(errore)
    process.exitCode = 1
  })
  .finally(() => db.$disconnect())
