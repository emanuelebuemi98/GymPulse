import { db } from './db'
import { calcolaRecord, massimoKg, volumeSerie, type RecordEsercizio } from './progressi'
import type { SerieRegistrata, UltimeVolte } from './tipi'
import { UTENTE_LOCALE_ID } from './utente'

const SOLO_MIE = { userId: UTENTE_LOCALE_ID }

// Conteggi e ultima seduta per la home.
export async function riepilogoHome() {
  const [totale, ultima] = await Promise.all([
    db.sessione.count({ where: SOLO_MIE }),
    db.sessione.findFirst({
      where: SOLO_MIE,
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
export async function elencoSessioni() {
  const sessioni = await db.sessione.findMany({
    where: SOLO_MIE,
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
    kcalStimate: sessione.kcalStimate,
    datiIniziali: sessione.datiIniziali,
  }))
}

type GruppoEsercizio = { id: string; nome: string; muscoli: string; serie: SerieRegistrata[] }

// Dettaglio di un allenamento, con gli esercizi nell'ordine in cui sono stati fatti.
export async function dettaglioSessione(sessioneId: string) {
  const sessione = await db.sessione.findFirst({
    where: { id: sessioneId, ...SOLO_MIE },
    include: {
      giorno: true,
      serie: { orderBy: { ordine: 'asc' }, include: { esercizio: true } },
    },
  })
  if (!sessione) return null

  const gruppi = new Map<string, GruppoEsercizio>()
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
    pesoCorporeoKg: sessione.pesoCorporeoKg,
    kcalStimate: sessione.kcalStimate,
    note: sessione.note,
    datiIniziali: sessione.datiIniziali,
    esercizi: [...gruppi.values()],
  }
}

// Per ogni esercizio richiesto, le serie dell'ultima seduta in cui è comparso.
export async function ultimeVolte(esercizioIds: string[]): Promise<UltimeVolte> {
  if (esercizioIds.length === 0) return {}

  const righe = await db.serieEseguita.findMany({
    where: { esercizioId: { in: esercizioIds }, sessione: SOLO_MIE },
    include: { sessione: { select: { id: true, data: true, datiIniziali: true } } },
    orderBy: [{ sessione: { data: 'desc' } }, { ordine: 'asc' }],
  })

  const risultato: UltimeVolte = {}
  const sessioneScelta = new Map<string, string>()
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

// Peso corporeo dell'ultima seduta che lo riporta: precompila il campo del form.
export async function ultimoPesoCorporeo(): Promise<number | null> {
  const sessione = await db.sessione.findFirst({
    where: { ...SOLO_MIE, pesoCorporeoKg: { not: null } },
    orderBy: { data: 'desc' },
    select: { pesoCorporeoKg: true },
  })
  return sessione?.pesoCorporeoKg ?? null
}

export type SedutaEsercizio = {
  sessioneId: string
  data: Date
  datiIniziali: boolean
  serie: SerieRegistrata[]
  massimoKg: number | null
  volumeKg: number
}

// Esercizi con almeno una serie registrata: sono quelli che hanno un andamento da mostrare.
export async function eserciziConDati() {
  const righe = await db.esercizio.findMany({
    where: { serie: { some: { sessione: SOLO_MIE } } },
    select: { id: true, nome: true },
  })
  return righe.sort((a, b) => a.nome.localeCompare(b.nome, 'it'))
}

// Tutte le sedute in cui compare un esercizio, dalla più vecchia.
export async function andamentoEsercizio(esercizioId: string): Promise<SedutaEsercizio[]> {
  const righe = await db.serieEseguita.findMany({
    where: { esercizioId, sessione: SOLO_MIE },
    include: { sessione: { select: { data: true, datiIniziali: true } } },
    orderBy: [{ sessione: { data: 'asc' } }, { ordine: 'asc' }],
  })

  const perSessione = new Map<string, { data: Date; datiIniziali: boolean; serie: SerieRegistrata[] }>()
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
export async function recordPerEsercizio(): Promise<RecordEsercizio[]> {
  const righe = await db.serieEseguita.findMany({
    where: { pesoKg: { not: null }, sessione: SOLO_MIE },
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

// Tutto quello che serve per un backup completo.
export async function datiPerBackup() {
  const [giorni, esercizi, sessioni] = await Promise.all([
    db.giornoScheda.findMany({ orderBy: { numero: 'asc' }, include: { voci: { orderBy: { ordine: 'asc' } } } }),
    db.esercizio.findMany({ orderBy: { id: 'asc' } }),
    db.sessione.findMany({
      where: SOLO_MIE,
      orderBy: { data: 'asc' },
      include: { serie: { orderBy: { ordine: 'asc' } } },
    }),
  ])
  return { giorni, esercizi, sessioni }
}
