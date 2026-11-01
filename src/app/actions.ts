'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { utenteDellaPagina } from '@/lib/accesso'
import { trovaOCreaEsercizio } from '@/lib/catalogo'
import { LIMITE_CSV, leggiCsv } from '@/lib/csv'
import { db } from '@/lib/db'
import { GIORNATE_MASSIME, prossimaSigla, titoloGiornata } from '@/lib/giornate'
import { campiObiettivo } from '@/lib/voci'
import { validaScheda } from '@/lib/scheda-schema'
import { validaSessione } from '@/lib/sessione-schema'

// Ogni azione è un punto d'ingresso pubblico: il browser non è fidato. L'utente si ricava SEMPRE dal cookie
// firmato (utenteCorrente) e finisce in ogni query: nessun id di persona arriva mai dal form, e i dati
// di un'altra persona non sono raggiungibili nemmeno conoscendone gli id.

const ID_MASSIMO = 2_147_483_647

// Ogni azione che scrive riceve come primo argomento l'id dell'account per cui la pagina è stata disegnata (utenteId) e lo
// confronta con quello del cookie (vedi utenteDellaPagina): una scheda rimasta aperta su un altro account non scrive.

function aggiornaPagine() {
  revalidatePath('/', 'layout')
}

// `scaduta` dice al form che l'accesso non vale più: oltre al messaggio mostra il modo di accedere di nuovo.
export async function salvaSessione(
  utenteId: number,
  input: unknown,
): Promise<{ id: number } | { errore: string; scaduta?: true }> {
  const utente = await utenteDellaPagina(utenteId)
  if ('errore' in utente) return utente
  const userId = utente.userId

  const esito = validaSessione(input)
  if (!esito.ok) return { errore: esito.errore }

  const { giornoId, note, durataMinuti, fcMediaBpm, fcMassimaBpm, kcalOrologio } = esito.dati
  // Gli esercizi senza serie confermate non vengono salvati (e non ne nasce uno nuovo nel catalogo).
  const esercizi = esito.dati.esercizi.filter((esercizio) => esercizio.serie.length > 0)

  // Solo una giornata attiva: una tolta dalla scheda (rimasta per lo storico) non riceve sedute nuove.
  const giorno = await db.giornoScheda.findFirst({ where: { userId, id: giornoId, attiva: true }, select: { id: true } })
  if (!giorno) return { errore: 'Questa giornata non è più nella scheda: le serie confermate restano nel telefono, ma non si possono salvare qui' }

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
        fcMediaBpm,
        fcMassimaBpm,
        kcalOrologio,
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

export async function salvaScheda(utenteId: number, input: unknown): Promise<{ ok: true } | { errore: string }> {
  const utente = await utenteDellaPagina(utenteId)
  if ('errore' in utente) return { errore: utente.errore }
  const userId = utente.userId

  const esito = validaScheda(input)
  if (!esito.ok) return { errore: esito.errore }
  const { giornoId, titolo, voci } = esito.dati

  const giorno = await db.giornoScheda.findFirst({ where: { userId, id: giornoId, attiva: true }, select: { id: true } })
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
      // I muscoli sono dell'esercizio e non della voce: valgono in ogni giornata che lo usa. updateMany con lo userId:
      // non si può toccare l'esercizio di un altro account nemmeno conoscendone l'id.
      await tx.esercizio.updateMany({ where: { id: esercizioId, userId }, data: { muscoli: voce.muscoli } })
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

// Aggiunge una giornata in fondo alla scheda, con la sigla successiva (A, B, C, D, ...), fino a 7. Parte vuota: gli
// esercizi si scelgono dalla pagina di modifica, dove si viene portati subito dopo.
export async function aggiungiGiornata(utenteId: number): Promise<{ id: string } | { errore: string }> {
  const utente = await utenteDellaPagina(utenteId)
  if ('errore' in utente) return { errore: utente.errore }
  const userId = utente.userId

  // Il blocco (advisory lock) per persona fa passare una richiesta alla volta: due "Aggiungi" insieme non sforano il limite
  // né scelgono la stessa sigla.
  const esito = await db.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(${userId}::bigint)`

    // Si contano solo le attive per il limite; le sigle invece si guardano tutte, tolte comprese, perché non si riusano.
    const tutte = await tx.giornoScheda.findMany({ where: { userId }, select: { id: true, attiva: true } })
    if (tutte.filter((g) => g.attiva).length >= GIORNATE_MASSIME) {
      return { errore: `Una scheda può avere al massimo ${GIORNATE_MASSIME} giornate` } as const
    }
    const sigla = prossimaSigla(tutte.map((g) => g.id))
    if (sigla === null) return { errore: 'Non ci sono più sigle disponibili' } as const

    await tx.giornoScheda.create({ data: { userId, id: sigla, titolo: titoloGiornata(sigla) } })
    return { id: sigla } as const
  })

  if ('id' in esito) aggiornaPagine()
  return esito
}

// Toglie una giornata dalla scheda. Una scheda ha sempre almeno una giornata. Se la giornata non ha sedute si cancella; se
// ne ha, si segna come non attiva e resta solo per lo storico: le sedute già registrate non si perdono. Gli esercizi
// restano nel catalogo della persona. Chi chiama deve avere chiesto conferma.
export async function rimuoviGiornata(
  utenteId: number,
  id: unknown,
): Promise<{ ok: true; archiviata: boolean } | { errore: string }> {
  const utente = await utenteDellaPagina(utenteId)
  if ('errore' in utente) return { errore: utente.errore }
  const userId = utente.userId
  if (typeof id !== 'string' || !/^[A-Z]$/.test(id)) return { errore: 'Giornata non valida' }

  try {
    const esito = await db.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(${userId}::bigint)`

      const attive = await tx.giornoScheda.findMany({ where: { userId, attiva: true }, select: { id: true } })
      if (!attive.some((g) => g.id === id)) return { errore: 'Giornata non trovata' } as const
      if (attive.length <= 1) return { errore: 'Una scheda ha sempre almeno una giornata' } as const

      // Le voci della giornata tolta non servono più in nessun caso.
      await tx.voceScheda.deleteMany({ where: { userId, giornoId: id } })
      const sedute = await tx.sessione.count({ where: { userId, giornoId: id } })
      if (sedute > 0) {
        await tx.giornoScheda.update({ where: { userId_id: { userId, id } }, data: { attiva: false } })
        return { ok: true, archiviata: true } as const
      }
      await tx.giornoScheda.delete({ where: { userId_id: { userId, id } } })
      return { ok: true, archiviata: false } as const
    })

    if ('ok' in esito) aggiornaPagine()
    return esito
  } catch (errore) {
    // Succede solo se una seduta è stata salvata su questa giornata tra il conteggio e la cancellazione: la chiave
    // esterna la protegge e la transazione torna indietro. Riprovando, la giornata resta per lo storico.
    console.error('[scheda] giornata non rimossa', errore)
    return { errore: 'Non sono riuscito a togliere la giornata: riprova' }
  }
}

export async function eliminaSessione(utenteId: number, id: unknown): Promise<{ errore: string } | never> {
  const utente = await utenteDellaPagina(utenteId)
  if ('errore' in utente) return { errore: utente.errore }
  const userId = utente.userId
  if (typeof id !== 'number' || !Number.isInteger(id) || id < 1 || id > ID_MASSIMO) return { errore: 'Seduta non valida' }

  const { count } = await db.sessione.deleteMany({ where: { id, userId } })
  if (count === 0) return { errore: 'Seduta non trovata' }

  aggiornaPagine()
  redirect('/storico')
}

// Aggiunge alle sedute DI CHI LA ESEGUE quelle scritte nel file CSV. Non cancella nulla: una seduta con la
// stessa data e la stessa giornata di una già presente viene saltata, così importare due volte lo stesso file
// non duplica niente. Gli esercizi si ritrovano per nome (senza badare alle maiuscole) e se non ci sono si creano.
// Le giornate invece devono esistere già: l'importazione non ne inventa. Contano anche quelle tolte dalla scheda e
// rimaste per lo storico, perché le sedute di un file esportato un tempo ci appartengono ancora.
export async function importaCsv(
  utenteId: number,
  testo: unknown,
): Promise<{ aggiunte: number; giaPresenti: number } | { errore: string }> {
  const utente = await utenteDellaPagina(utenteId)
  if ('errore' in utente) return { errore: utente.errore }
  const userId = utente.userId
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
        data: nuove.map(({ data, giornoId, note, durataMinuti, fcMediaBpm, fcMassimaBpm, kcalOrologio, datiIniziali }) => ({
          userId,
          giornoId,
          data,
          note,
          durataMinuti,
          fcMediaBpm,
          fcMassimaBpm,
          kcalOrologio,
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
