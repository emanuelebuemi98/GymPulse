import { giorni, type Esercizio } from '../data/scheda'
import { prossimoCarico, stimaRM } from './allenamento'
import type { UltimaSessione } from './sessione-schema'

export type SerieRegistrata = { pesoKg: number | null; ripetizioni: number }

export type SuggerimentoCarico = {
  kg: number
  aumenta: boolean
  ripMax: number
}

// Volume della serie: peso × ripetizioni, sommati. Le serie senza peso non contano.
export function volumeSerie(serie: SerieRegistrata[]): number {
  return serie.reduce((totale, s) => totale + (s.pesoKg ?? 0) * s.ripetizioni, 0)
}

// Miglior massimale stimato fra le serie con peso. Null se nessuna serie ha un peso.
export function miglioreRM(serie: SerieRegistrata[]): number | null {
  const stime = serie.flatMap((s) => (s.pesoKg === null ? [] : [stimaRM(s.pesoKg, s.ripetizioni)]))
  return stime.length === 0 ? null : Math.max(...stime)
}

// Carichi da proporre al prossimo allenamento. Solo per gli esercizi con "carico a salire" nella scheda.
export function suggerisciCarichi(
  esercizi: Esercizio[],
  ultima: UltimaSessione | null,
): Record<string, SuggerimentoCarico> {
  const suggerimenti: Record<string, SuggerimentoCarico> = {}
  if (!ultima) return suggerimenti

  for (const esercizio of esercizi) {
    const { obiettivo, incrementoKg } = esercizio
    if (obiettivo.tipo !== 'serie' || incrementoKg === undefined) continue

    const serie = (ultima.serie[esercizio.id] ?? []).flatMap((s) =>
      s.pesoKg === null ? [] : [{ peso: s.pesoKg, ripetizioni: s.ripetizioni }],
    )
    const kg = prossimoCarico(serie, obiettivo.ripMax, incrementoKg)
    if (kg === null) continue

    const massimo = Math.max(...serie.map((s) => s.peso))
    suggerimenti[esercizio.id] = { kg, aumenta: kg > massimo, ripMax: obiettivo.ripMax }
  }
  return suggerimenti
}

// Esercizio del catalogo per id, compresi gli addominali di ogni giorno.
export function trovaEsercizio(id: string): Esercizio | undefined {
  return giorni.flatMap((giorno) => [...giorno.esercizi, giorno.addome]).find((e) => e.id === id)
}
