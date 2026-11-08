import type { SedutaEsportata } from './csv'
import { db } from './db'
import type { SerieConGruppo } from './panoramica'
import { calcolaRecord, massimoKg, pesoTotaleKg, volumeSerie, type RecordEsercizio } from './progressi'
import type { SerieRegistrata, UltimeVolte } from './tipi'

// Quante miniature di esercizi mostra ogni card dello storico; gli altri esercizi si contano ("+4").
const ANTEPRIME_IN_STORICO = 4

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
    include: {
      giorno: true,
      serie: {
        orderBy: { ordine: 'asc' },
        include: { esercizio: { select: { nome: true, catalogo: { select: { immagine: true } } } } },
      },
    },
  })

  return sessioni.map((sessione) => {
    // Gli esercizi della seduta una volta sola, nell'ordine in cui sono stati fatti: servono le miniature della card.
    const esercizi = new Map<number, { nome: string; immagine: string }>()
    for (const riga of sessione.serie) {
      if (!esercizi.has(riga.esercizioId)) {
        esercizi.set(riga.esercizioId, { nome: riga.esercizio.nome, immagine: riga.esercizio.catalogo?.immagine ?? '' })
      }
    }
    const conImmagine = [...esercizi.values()].filter((esercizio) => esercizio.immagine !== '')

    return {
      id: sessione.id,
      data: sessione.data,
      giornoId: sessione.giornoId,
      giornoTitolo: sessione.giorno.titolo,
      numeroEsercizi: esercizi.size,
      numeroSerie: sessione.serie.length,
      volumeKg: volumeSerie(sessione.serie),
      durataMinuti: sessione.durataMinuti,
      datiIniziali: sessione.datiIniziali,
      anteprime: conImmagine.slice(0, ANTEPRIME_IN_STORICO),
      eserciziInPiu: Math.max(0, esercizi.size - ANTEPRIME_IN_STORICO),
    }
  })
}

type GruppoEsercizio = { id: number; nome: string; nomeEn: string; immagine: string; categoria: string; serie: SerieRegistrata[] }

// Dettaglio di un allenamento, con gli esercizi nell'ordine in cui sono stati fatti.
export async function dettaglioSessione(userId: number, sessioneId: number) {
  const sessione = await db.sessione.findFirst({
    where: { id: sessioneId, userId },
    include: {
      giorno: true,
      serie: {
        orderBy: { ordine: 'asc' },
        include: { esercizio: { include: { catalogo: { select: { nomeEn: true, immagine: true } } } } },
      },
    },
  })
  if (!sessione) return null

  const gruppi = new Map<number, GruppoEsercizio>()
  for (const riga of sessione.serie) {
    const gruppo = gruppi.get(riga.esercizioId) ?? {
      id: riga.esercizioId,
      nome: riga.esercizio.nome,
      nomeEn: riga.esercizio.catalogo?.nomeEn ?? '',
      immagine: riga.esercizio.catalogo?.immagine ?? '',
      categoria: riga.esercizio.categoria,
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
  pesoTotaleKg: number
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
    pesoTotaleKg: pesoTotaleKg(gruppo.serie),
  }))
}

// Tutte le serie con l'esercizio, il suo gruppo muscolare e la data della seduta: servono ai kg per gruppo della
// panoramica. Dalla più vecchia, e dentro una seduta nell'ordine in cui sono state fatte.
export async function serieConGruppo(userId: number): Promise<SerieConGruppo[]> {
  const righe = await db.serieEseguita.findMany({
    where: { userId },
    select: {
      esercizioId: true,
      pesoKg: true,
      esercizio: { select: { nome: true, categoria: true } },
      sessione: { select: { data: true } },
    },
    orderBy: [{ sessione: { data: 'asc' } }, { ordine: 'asc' }],
  })
  return righe.map((riga) => ({
    data: riga.sessione.data,
    esercizioId: riga.esercizioId,
    esercizio: riga.esercizio.nome,
    categoria: riga.esercizio.categoria,
    pesoKg: riga.pesoKg,
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
    note: sessione.note,
    datiIniziali: sessione.datiIniziali,
    serie: sessione.serie.map((s) => ({ esercizio: s.esercizio.nome, pesoKg: s.pesoKg, ripetizioni: s.ripetizioni })),
  }))
}
