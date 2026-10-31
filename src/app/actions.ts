'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { utenteCorrente } from '@/lib/accesso'
import { leggiBackup } from '@/lib/backup'
import { trovaOCreaEsercizio } from '@/lib/catalogo'
import { db } from '@/lib/db'
import { campiObiettivo } from '@/lib/voci'
import { validaScheda } from '@/lib/scheda-schema'
import { validaSessione } from '@/lib/sessione-schema'

// Ogni azione è un punto d'ingresso pubblico: il browser non è fidato. L'utente si ricava SEMPRE dal cookie
// firmato (utenteCorrente) e finisce in ogni query: nessun id di persona arriva mai dal form, e i dati
// di un'altra persona non sono raggiungibili nemmeno conoscendone gli id.

const LIMITE_BACKUP = 900_000 // caratteri: i server action accettano al massimo 1 MB
const ID_MASSIMO = 2_147_483_647
const NON_AUTORIZZATO = 'Sessione scaduta: accedi di nuovo e riprova (la sessione in corso è salvata nel browser).'

function aggiornaPagine() {
  revalidatePath('/', 'layout')
}

export async function salvaSessione(input: unknown): Promise<{ id: number } | { errore: string }> {
  const userId = await utenteCorrente()
  if (!userId) return { errore: NON_AUTORIZZATO }

  const esito = validaSessione(input)
  if (!esito.ok) return { errore: esito.errore }

  const { giornoId, note, durataMinuti, pesoCorporeoKg } = esito.dati
  // Gli esercizi senza serie confermate non vengono salvati (e non ne nasce uno nuovo nel catalogo).
  const esercizi = esito.dati.esercizi.filter((esercizio) => esercizio.serie.length > 0)

  const giorno = await db.giornoScheda.findUnique({
    where: { userId_id: { userId, id: giornoId } },
    select: { id: true },
  })
  if (!giorno) return { errore: 'Giorno non valido' }

  const idCatalogo = esercizi.flatMap((esercizio) => (esercizio.esercizioId !== null ? [esercizio.esercizioId] : []))
  const trovati = await db.esercizio.count({ where: { userId, id: { in: idCatalogo } } })
  if (trovati !== idCatalogo.length) return { errore: 'Un esercizio non esiste più' }

  const id = await db.$transaction(async (tx) => {
    let ordine = 0
    const serie: { esercizioId: number; ordine: number; pesoKg: number | null; ripetizioni: number }[] = []
    for (const esercizio of esercizi) {
      const esercizioId = esercizio.esercizioId ?? (await trovaOCreaEsercizio(tx, userId, esercizio.nomeNuovo!))
      for (const s of esercizio.serie) {
        serie.push({ esercizioId, ordine: ++ordine, pesoKg: s.pesoKg, ripetizioni: s.ripetizioni })
      }
    }

    const creata = await tx.sessione.create({
      data: {
        userId,
        giornoId,
        data: esito.istante,
        note: note ? note : null,
        durataMinuti,
        pesoCorporeoKg,
        // Dentro una creazione annidata lo userId delle serie viene dalla seduta: indicarlo di nuovo è un errore.
        serie: { create: serie },
      },
      select: { id: true },
    })
    return creata.id
  })

  aggiornaPagine()
  return { id }
}

export async function salvaScheda(input: unknown): Promise<{ ok: true } | { errore: string }> {
  const userId = await utenteCorrente()
  if (!userId) return { errore: NON_AUTORIZZATO }

  const esito = validaScheda(input)
  if (!esito.ok) return { errore: esito.errore }
  const { giornoId, titolo, voci } = esito.dati

  const giorno = await db.giornoScheda.findUnique({
    where: { userId_id: { userId, id: giornoId } },
    select: { id: true },
  })
  if (!giorno) return { errore: 'Giornata non trovata' }

  const idCatalogo = voci.flatMap((voce) => (voce.esercizioId !== null ? [voce.esercizioId] : []))
  const trovati = await db.esercizio.count({ where: { userId, id: { in: idCatalogo } } })
  if (trovati !== idCatalogo.length) return { errore: 'Un esercizio non esiste più' }

  // La storia non si tocca: le serie già registrate puntano agli esercizi, non alle voci della scheda.
  await db.$transaction(async (tx) => {
    await tx.giornoScheda.update({ where: { userId_id: { userId, id: giornoId } }, data: { titolo } })
    await tx.voceScheda.deleteMany({ where: { userId, giornoId } })

    let ordine = 0
    for (const voce of voci) {
      const esercizioId = voce.esercizioId ?? (await trovaOCreaEsercizio(tx, userId, voce.nomeNuovo!))
      await tx.voceScheda.create({
        data: {
          userId,
          giornoId,
          esercizioId,
          ordine: ++ordine,
          nota: voce.nota,
          incrementoKg: voce.incrementoKg,
          ...campiObiettivo(voce.obiettivo),
        },
      })
    }
  })

  aggiornaPagine()
  return { ok: true }
}

export async function eliminaSessione(id: unknown): Promise<{ errore: string } | never> {
  const userId = await utenteCorrente()
  if (!userId) return { errore: NON_AUTORIZZATO }
  if (typeof id !== 'number' || !Number.isInteger(id) || id < 1 || id > ID_MASSIMO) return { errore: 'Seduta non valida' }

  const { count } = await db.sessione.deleteMany({ where: { id, userId } })
  if (count === 0) return { errore: 'Seduta non trovata' }

  aggiornaPagine()
  redirect('/storico')
}

// Sostituisce scheda, esercizi e sedute DI CHI LA ESEGUE con il contenuto del backup: i dati delle altre
// persone non si toccano. Il chiamante chiede conferma.
//
// Gli id di esercizi e sedute sono numeri unici in tutto il database, quindi quelli scritti nel file non si
// possono riusare: potrebbero già appartenere a un'altra persona (o a questa stessa, prima della sostituzione).
// Il database ne assegna di nuovi e qui si ricollegano voci e serie. Date, pesi e ripetizioni restano identici.
export async function importaBackup(testo: unknown): Promise<{ sedute: number } | { errore: string }> {
  const userId = await utenteCorrente()
  if (!userId) return { errore: NON_AUTORIZZATO }
  if (typeof testo !== 'string') return { errore: 'File non valido' }
  if (testo.length > LIMITE_BACKUP) return { errore: 'Il file è troppo grande per essere importato' }

  const esito = leggiBackup(testo)
  if (!esito.ok) return { errore: esito.errore }
  const { esercizi, scheda, sessioni } = esito.backup

  await db.$transaction(
    async (tx) => {
      // Cancellare le sedute porta via le loro serie; poi la scheda e il catalogo, solo di questa persona.
      await tx.sessione.deleteMany({ where: { userId } })
      await tx.voceScheda.deleteMany({ where: { userId } })
      await tx.giornoScheda.deleteMany({ where: { userId } })
      await tx.esercizio.deleteMany({ where: { userId } })

      // Esercizi: il database assegna i nuovi id, in ordine, e qui si costruisce la corrispondenza vecchio → nuovo.
      const creati = await tx.esercizio.createManyAndReturn({
        data: esercizi.map(({ nome, muscoli }) => ({ userId, nome, muscoli })),
        select: { id: true, nome: true },
      })
      if (creati.length !== esercizi.length || creati.some((c, i) => c.nome !== esercizi[i].nome)) {
        throw new Error('Importazione interrotta: gli esercizi creati non corrispondono al file')
      }
      const nuoviEsercizi = new Map(esercizi.map((e, i) => [e.id, creati[i].id]))

      await tx.giornoScheda.createMany({
        data: scheda.map(({ id, titolo }) => ({ userId, id, titolo })),
      })
      await tx.voceScheda.createMany({
        data: scheda.flatMap((giorno) =>
          giorno.voci.map((voce) => ({
            ...voce,
            userId,
            giornoId: giorno.id,
            esercizioId: nuoviEsercizi.get(voce.esercizioId)!,
          })),
        ),
      })

      // Sedute: stesso procedimento. L'ordine con cui si inseriscono è quello del file.
      const sedute = await tx.sessione.createManyAndReturn({
        data: sessioni.map(({ serie: _serie, id: _id, data, ...resto }) => ({ ...resto, userId, data: new Date(data) })),
        select: { id: true, data: true },
      })
      if (sedute.length !== sessioni.length || sedute.some((s, i) => s.data.toISOString() !== new Date(sessioni[i].data).toISOString())) {
        throw new Error('Importazione interrotta: le sedute create non corrispondono al file')
      }
      await tx.serieEseguita.createMany({
        data: sessioni.flatMap((sessione, i) =>
          sessione.serie.map((serie) => ({
            ...serie,
            userId,
            sessioneId: sedute[i].id,
            esercizioId: nuoviEsercizi.get(serie.esercizioId)!,
          })),
        ),
      })
    },
    { timeout: 30_000 },
  )

  aggiornaPagine()
  return { sedute: sessioni.length }
}
