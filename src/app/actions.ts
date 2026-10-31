'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { utenteCorrente } from '@/lib/accesso'
import { trovaOCreaEsercizio } from '@/lib/catalogo'
import { LIMITE_CSV, leggiCsv } from '@/lib/csv'
import { db } from '@/lib/db'
import { campiObiettivo } from '@/lib/voci'
import { validaScheda } from '@/lib/scheda-schema'
import { validaSessione } from '@/lib/sessione-schema'

// Ogni azione è un punto d'ingresso pubblico: il browser non è fidato. L'utente si ricava SEMPRE dal cookie
// firmato (utenteCorrente) e finisce in ogni query: nessun id di persona arriva mai dal form, e i dati
// di un'altra persona non sono raggiungibili nemmeno conoscendone gli id.

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

  const { giornoId, note, durataMinuti } = esito.dati
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

// Aggiunge alle sedute DI CHI LA ESEGUE quelle scritte nel file CSV. Non cancella nulla: una seduta con la
// stessa data e la stessa giornata di una già presente viene saltata, così importare due volte lo stesso file
// non duplica niente. Gli esercizi si ritrovano per nome (senza badare alle maiuscole) e se non ci sono si creano.
// Le giornate invece devono esistere già nella scheda: l'importazione non ne inventa.
export async function importaCsv(testo: unknown): Promise<{ aggiunte: number; giaPresenti: number } | { errore: string }> {
  const userId = await utenteCorrente()
  if (!userId) return { errore: NON_AUTORIZZATO }
  if (typeof testo !== 'string') return { errore: 'File non valido' }
  if (testo.length > LIMITE_CSV) return { errore: 'Il file è troppo grande per essere importato' }

  const esito = leggiCsv(testo)
  if (!esito.ok) return { errore: esito.errore }
  const { sedute } = esito

  const giornate = new Set((await db.giornoScheda.findMany({ where: { userId }, select: { id: true } })).map((g) => g.id))
  const senzaGiornata = sedute.find((seduta) => !giornate.has(seduta.giornoId))
  if (senzaGiornata) {
    return { errore: `Riga ${senzaGiornata.riga}: la giornata "${senzaGiornata.giornoId}" non esiste nella tua scheda` }
  }

  const chiave = (data: Date, giornoId: string) => `${data.getTime()}|${giornoId}`
  const esistenti = await db.sessione.findMany({
    where: { userId, data: { in: sedute.map((seduta) => seduta.data) } },
    select: { data: true, giornoId: true },
  })
  const presenti = new Set(esistenti.map((seduta) => chiave(seduta.data, seduta.giornoId)))
  const nuove = sedute.filter((seduta) => !presenti.has(chiave(seduta.data, seduta.giornoId)))
  if (nuove.length === 0) return { aggiunte: 0, giaPresenti: sedute.length }

  await db.$transaction(
    async (tx) => {
      // Un esercizio si cerca (o si crea) una volta sola, anche se compare in cento sedute.
      const esercizi = new Map<string, number>()
      for (const seduta of nuove) {
        for (const serie of seduta.serie) {
          const nome = serie.esercizio.toLowerCase()
          if (!esercizi.has(nome)) esercizi.set(nome, await trovaOCreaEsercizio(tx, userId, serie.esercizio))
        }
      }

      const create = await tx.sessione.createManyAndReturn({
        data: nuove.map(({ data, giornoId, note, durataMinuti, datiIniziali }) => ({
          userId,
          giornoId,
          data,
          note,
          durataMinuti,
          datiIniziali,
        })),
        select: { id: true, data: true, giornoId: true },
      })
      if (create.length !== nuove.length) throw new Error('Importazione interrotta: le sedute create non corrispondono al file')
      const idSedute = new Map(create.map((seduta) => [chiave(seduta.data, seduta.giornoId), seduta.id]))

      await tx.serieEseguita.createMany({
        data: nuove.flatMap((seduta) => {
          const sessioneId = idSedute.get(chiave(seduta.data, seduta.giornoId))!
          return seduta.serie.map((serie, indice) => ({
            userId,
            sessioneId,
            esercizioId: esercizi.get(serie.esercizio.toLowerCase())!,
            ordine: indice + 1,
            pesoKg: serie.pesoKg,
            ripetizioni: serie.ripetizioni,
          }))
        }),
      })
    },
    { timeout: 30_000 },
  )

  aggiornaPagine()
  return { aggiunte: nuove.length, giaPresenti: sedute.length - nuove.length }
}
