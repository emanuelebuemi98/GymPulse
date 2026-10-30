import { giorni } from '../data/scheda'
import { db } from './db'
import { volumeSerie, type SerieRegistrata } from './progressi'
import { UTENTE_LOCALE_ID } from './utente'

// Riepilogo di ogni allenamento, dal più recente.
export async function elencoSessioni() {
  const sessioni = await db.sessione.findMany({
    where: { userId: UTENTE_LOCALE_ID },
    orderBy: { data: 'desc' },
    include: { giorno: true, serie: true },
  })

  return sessioni.map((sessione) => ({
    id: sessione.id,
    data: sessione.data,
    giornoNumero: sessione.giorno.numero,
    giornoTitolo: sessione.giorno.titolo,
    durataMinuti: sessione.durataMinuti,
    kcalStimate: sessione.kcalStimate,
    numeroSerie: sessione.serie.length,
    volumeKg: volumeSerie(sessione.serie),
  }))
}

type GruppoEsercizio = {
  id: string
  nome: string
  muscoli: string
  serie: SerieRegistrata[]
}

// Dettaglio di un allenamento, con gli esercizi nell'ordine della scheda.
export async function dettaglioSessione(sessioneId: string) {
  const sessione = await db.sessione.findFirst({
    where: { id: sessioneId, userId: UTENTE_LOCALE_ID },
    include: {
      giorno: true,
      serie: { orderBy: { ordine: 'asc' }, include: { esercizio: true } },
    },
  })
  if (!sessione) return null

  const giorno = giorni.find((g) => g.id === sessione.giornoId)
  const ordineScheda = giorno ? [...giorno.esercizi, giorno.addome].map((e) => e.id) : []

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

  const esercizi = [...gruppi.values()].sort(
    (a, b) => ordineScheda.indexOf(a.id) - ordineScheda.indexOf(b.id),
  )

  return {
    id: sessione.id,
    data: sessione.data,
    giornoNumero: sessione.giorno.numero,
    giornoTitolo: sessione.giorno.titolo,
    durataMinuti: sessione.durataMinuti,
    pesoCorporeoKg: sessione.pesoCorporeoKg,
    kcalStimate: sessione.kcalStimate,
    esercizi,
  }
}

// Tutte le serie di un esercizio, raggruppate per allenamento, dalla più vecchia.
export async function storicoEsercizio(esercizioId: string) {
  const serie = await db.serieEseguita.findMany({
    where: { esercizioId, sessione: { userId: UTENTE_LOCALE_ID } },
    include: { sessione: true },
    orderBy: [{ sessione: { data: 'asc' } }, { ordine: 'asc' }],
  })

  const perSessione = new Map<string, { sessioneId: string; data: Date; serie: SerieRegistrata[] }>()
  for (const riga of serie) {
    const gruppo = perSessione.get(riga.sessioneId) ?? {
      sessioneId: riga.sessioneId,
      data: riga.sessione.data,
      serie: [],
    }
    gruppo.serie.push({ pesoKg: riga.pesoKg, ripetizioni: riga.ripetizioni })
    perSessione.set(riga.sessioneId, gruppo)
  }

  return [...perSessione.values()]
}
