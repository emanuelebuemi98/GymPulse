import type { SedutaEsportata } from './csv'
import { db } from './db'
import { calcolaRecord, massimoKg, volumeSerie, type RecordEsercizio } from './progressi'
import type { SerieRegistrata, UltimeVolte } from './tipi'

// Conteggi e ultima seduta per la home.
export async function riepilogoHome(userId: number) {
  const [totale, ultima] = await Promise.all([
    db.sessione.count({ where: { userId } }),
    db.sessione.findFirst({
      where: { userId },
      orderBy: { data: 'desc' },
      include: { giorno: true, serie: { select: { esercizioId: true } } },
    }),
  ])

  return {
    totale,
    ultima: ultima && {
      id: ultima.id,
      data: ultima.data,
      giornoId: ultima.giornoId,
      giornoTitolo: ultima.giorno.titolo,
      numeroEsercizi: new Set(ultima.serie.map((s) => s.esercizioId)).size,
      datiIniziali: ultima.datiIniziali,
    },
  }
}

// Riepilogo di ogni allenamento, dal più recente.
export async function elencoSessioni(userId: number) {
  const sessioni = await db.sessione.findMany({
    where: { userId },
    orderBy: { data: 'desc' },
    include: { giorno: true, serie: true },
  })

  return sessioni.map((sessione) => ({
    id: sessione.id,
    data: sessione.data,
    giornoId: sessione.giornoId,
    giornoTitolo: sessione.giorno.titolo,
    numeroEsercizi: new Set(sessione.serie.map((s) => s.esercizioId)).size,
    numeroSerie: sessione.serie.length,
    volumeKg: volumeSerie(sessione.serie),
    durataMinuti: sessione.durataMinuti,
    fcMediaBpm: sessione.fcMediaBpm,
    kcalOrologio: sessione.kcalOrologio,
    datiIniziali: sessione.datiIniziali,
  }))
}

type GruppoEsercizio = { id: number; nome: string; muscoli: string; serie: SerieRegistrata[] }

// Dettaglio di un allenamento, con gli esercizi nell'ordine in cui sono stati fatti.
export async function dettaglioSessione(userId: number, sessioneId: number) {
  const sessione = await db.sessione.findFirst({
    where: { id: sessioneId, userId },
    include: {
      giorno: true,
      serie: { orderBy: { ordine: 'asc' }, include: { esercizio: true } },
    },
  })
  if (!sessione) return null

  const gruppi = new Map<number, GruppoEsercizio>()
  for (const riga of sessione.serie) {
    const gruppo = gruppi.get(riga.esercizioId) ?? {
      id: riga.esercizioId,
      nome: riga.esercizio.nome,
      muscoli: riga.esercizio.muscoli,
      serie: [],
    }
    gruppo.serie.push({ pesoKg: riga.pesoKg, ripetizioni: riga.ripetizioni })
    gruppi.set(riga.esercizioId, gruppo)
  }

  return {
    id: sessione.id,
    data: sessione.data,
    giornoId: sessione.giornoId,
    giornoTitolo: sessione.giorno.titolo,
    durataMinuti: sessione.durataMinuti,
    fcMediaBpm: sessione.fcMediaBpm,
    fcMassimaBpm: sessione.fcMassimaBpm,
    kcalOrologio: sessione.kcalOrologio,
    note: sessione.note,
    datiIniziali: sessione.datiIniziali,
    esercizi: [...gruppi.values()],
  }
}

// Per ogni esercizio richiesto, le serie dell'ultima seduta in cui è comparso.
export async function ultimeVolte(userId: number, esercizioIds: number[]): Promise<UltimeVolte> {
  if (esercizioIds.length === 0) return {}

  const righe = await db.serieEseguita.findMany({
    where: { userId, esercizioId: { in: esercizioIds } },
    include: { sessione: { select: { id: true, data: true, datiIniziali: true } } },
    orderBy: [{ sessione: { data: 'desc' } }, { ordine: 'asc' }],
  })

  const risultato: UltimeVolte = {}
  const sessioneScelta = new Map<number, number>()
  for (const riga of righe) {
    const scelta = sessioneScelta.get(riga.esercizioId)
    if (scelta === undefined) sessioneScelta.set(riga.esercizioId, riga.sessioneId)
    else if (scelta !== riga.sessioneId) continue

    risultato[riga.esercizioId] ??= {
      data: riga.sessione.data.toISOString(),
      datiIniziali: riga.sessione.datiIniziali,
      serie: [],
    }
    risultato[riga.esercizioId].serie.push({ pesoKg: riga.pesoKg, ripetizioni: riga.ripetizioni })
  }
  return risultato
}

export type SedutaEsercizio = {
  sessioneId: number
  data: Date
  datiIniziali: boolean
  serie: SerieRegistrata[]
  massimoKg: number | null
  volumeKg: number
}

// Esercizi con almeno una serie registrata: sono quelli che hanno un andamento da mostrare.
export async function eserciziConDati(userId: number) {
  const righe = await db.esercizio.findMany({
    where: { userId, serie: { some: {} } },
    select: { id: true, nome: true },
  })
  return righe.sort((a, b) => a.nome.localeCompare(b.nome, 'it'))
}

// Tutte le sedute in cui compare un esercizio, dalla più vecchia.
export async function andamentoEsercizio(userId: number, esercizioId: number): Promise<SedutaEsercizio[]> {
  const righe = await db.serieEseguita.findMany({
    where: { userId, esercizioId },
    include: { sessione: { select: { data: true, datiIniziali: true } } },
    orderBy: [{ sessione: { data: 'asc' } }, { ordine: 'asc' }],
  })

  const perSessione = new Map<number, { data: Date; datiIniziali: boolean; serie: SerieRegistrata[] }>()
  for (const riga of righe) {
    const gruppo = perSessione.get(riga.sessioneId) ?? {
      data: riga.sessione.data,
      datiIniziali: riga.sessione.datiIniziali,
      serie: [],
    }
    gruppo.serie.push({ pesoKg: riga.pesoKg, ripetizioni: riga.ripetizioni })
    perSessione.set(riga.sessioneId, gruppo)
  }

  return [...perSessione.entries()].map(([sessioneId, gruppo]) => ({
    sessioneId,
    ...gruppo,
    massimoKg: massimoKg(gruppo.serie),
    volumeKg: volumeSerie(gruppo.serie),
  }))
}

// Il peso più alto mai sollevato per ogni esercizio.
export async function recordPerEsercizio(userId: number): Promise<RecordEsercizio[]> {
  const righe = await db.serieEseguita.findMany({
    where: { userId, pesoKg: { not: null } },
    include: { esercizio: { select: { nome: true } }, sessione: { select: { data: true } } },
  })
  return calcolaRecord(
    righe.map((riga) => ({
      esercizioId: riga.esercizioId,
      nome: riga.esercizio.nome,
      pesoKg: riga.pesoKg,
      data: riga.sessione.data,
    })),
  )
}

// Tutte le sedute, dalla più vecchia, con il nome dell'esercizio al posto del suo id: il file CSV non porta id.
export async function sedutePerCsv(userId: number): Promise<SedutaEsportata[]> {
  const sessioni = await db.sessione.findMany({
    where: { userId },
    orderBy: { data: 'asc' },
    include: { serie: { orderBy: { ordine: 'asc' }, include: { esercizio: { select: { nome: true } } } } },
  })
  return sessioni.map((sessione) => ({
    data: sessione.data,
    giornoId: sessione.giornoId,
    durataMinuti: sessione.durataMinuti,
    fcMediaBpm: sessione.fcMediaBpm,
    fcMassimaBpm: sessione.fcMassimaBpm,
    kcalOrologio: sessione.kcalOrologio,
    note: sessione.note,
    datiIniziali: sessione.datiIniziali,
    serie: sessione.serie.map((s) => ({ esercizio: s.esercizio.nome, pesoKg: s.pesoKg, ripetizioni: s.ripetizioni })),
  }))
}
