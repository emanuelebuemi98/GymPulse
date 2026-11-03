import 'dotenv/config'
import { readFileSync } from 'node:fs'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../src/generated/prisma/client'
import { CHIAVI_CATEGORIE } from '../src/lib/categorie'

// Carica il catalogo degli esercizi dal file prisma/dati/catalogo-esercizi.json nella tabella CatalogoEsercizio. Si può
// rilanciare quante volte si vuole: le righe già presenti (stesso slug) si aggiornano, quelle nuove si aggiungono, e non
// si cancella mai niente, perché gli esercizi delle persone puntano al catalogo. Si lancia così:
//   npm run db:catalogo
//
// Alla fine collega al catalogo gli esercizi delle persone che non lo sono ancora, se il loro nome coincide con il nome
// italiano, il nome inglese o un alias di una voce del catalogo (senza badare alle maiuscole). L'esercizio prende il nome
// e la categoria del catalogo: per esempio "Curl con manubri alternato" diventa "Curl in piedi con manubri alternati". Le
// serie già registrate e le voci della scheda restano agganciate allo stesso esercizio, quindi storico e progressi non
// cambiano: cambia solo il nome. Un esercizio già collegato non si tocca. Quello che non si riconosce resta com'è e viene
// elencato alla fine.
//
// Per vedere cosa cambierebbe senza scrivere niente: PROVA=1 npm run db:catalogo (in PowerShell: $env:PROVA="1"; npm.cmd
// run db:catalogo). Fa tutto dentro una transazione e alla fine la annulla.
//
// Per le foto: il campo `immagine` del JSON è il percorso nella cartella public/esercizi; se manca, la foto non c'è.

const connectionString = process.env.DATABASE_URL
if (!connectionString) throw new Error('DATABASE_URL non è impostata: crea il file .env')

const SOLO_PROVA = process.env.PROVA === '1'

type Voce = {
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
  alias?: string[]
}

const voci = JSON.parse(readFileSync(new URL('./dati/catalogo-esercizi.json', import.meta.url), 'utf8')) as Voce[]
const chiave = (testo: string) => testo.trim().toLowerCase()

// Il file è la fonte di verità: se è sbagliato ci si ferma prima di toccare il database.
const problemi: string[] = []
const slug = new Set<string>()
const nomiUsati = new Map<string, string>()
for (const voce of voci) {
  const dove = voce.nomeIt || voce.slug || '(senza nome)'
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
  // Un nome (italiano, inglese o alias) non può servire a due voci: il collegamento per nome sarebbe ambiguo.
  for (const nome of [voce.nomeIt, voce.nomeEn, ...(voce.alias ?? [])]) {
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

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString }) })

class Annullato extends Error {}

async function main() {
  const prima = await db.catalogoEsercizio.count()
  let legati = 0
  const cambi: string[] = []
  const restano: string[] = []

  try {
    await db.$transaction(
      async (tx) => {
        for (const voce of voci) {
          const dati = {
            nomeIt: voce.nomeIt.trim(),
            nomeEn: voce.nomeEn.trim(),
            categoria: voce.categoria,
            attrezzatura: voce.attrezzatura.trim(),
            muscoloPrincipale: voce.muscoloPrincipale.trim(),
            muscoliSecondari: (voce.muscoliSecondari ?? '').trim(),
            tipoMovimento: voce.tipoMovimento.trim(),
            immagine: voce.immagine ?? null,
            esecuzione: voce.esecuzione?.trim() ? voce.esecuzione.trim() : null,
            accortezze: voce.accortezze?.trim() ? voce.accortezze.trim() : null,
            alias: voce.alias && voce.alias.length > 0 ? voce.alias.map((a) => a.trim()).join('\n') : null,
          }
          await tx.catalogoEsercizio.upsert({ where: { slug: voce.slug }, create: { slug: voce.slug, ...dati }, update: dati })
        }

        // Per ogni nome (italiano, inglese, alias) la riga del catalogo a cui appartiene.
        const righe = await tx.catalogoEsercizio.findMany({ select: { id: true, slug: true, nomeIt: true, categoria: true } })
        const perSlug = new Map(righe.map((riga) => [riga.slug, riga]))
        const perNome = new Map<string, (typeof righe)[number]>()
        for (const voce of voci) {
          const riga = perSlug.get(voce.slug)!
          for (const nome of [voce.nomeIt, voce.nomeEn, ...(voce.alias ?? [])]) perNome.set(chiave(nome), riga)
        }

        const liberi = await tx.esercizio.findMany({
          where: { catalogoId: null },
          select: { id: true, userId: true, nome: true, user: { select: { username: true } } },
          orderBy: [{ userId: 'asc' }, { id: 'asc' }],
        })
        for (const esercizio of liberi) {
          const riga = perNome.get(chiave(esercizio.nome))
          const chi = esercizio.user.username
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

        if (SOLO_PROVA) throw new Annullato()
      },
      { timeout: 60_000 },
    )
  } catch (errore) {
    if (!(errore instanceof Annullato)) throw errore
  }

  const dopo = await db.catalogoEsercizio.count()
  console.log(SOLO_PROVA ? '*** PROVA: non è stato scritto niente (transazione annullata) ***\n' : '')
  console.log(`Esercizi delle persone collegati al catalogo: ${legati}`)
  for (const riga of cambi) console.log(`  ${riga}`)
  if (restano.length > 0) {
    console.log(`\nNon riconosciuti, restano personali: ${restano.length}`)
    for (const riga of restano) console.log(`  ${riga}`)
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
