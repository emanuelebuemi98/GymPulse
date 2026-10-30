import type { Esercizio } from '../data/scheda'
import { prossimoCarico, stimaRM } from './allenamento'
import type { SerieRegistrata, UltimeVolte } from './tipi'

export type SuggerimentoCarico = {
  kg: number
  aumenta: boolean
  ripMax: number
  // Le ripetizioni dell'ultima volta non sono state registrate davvero: non si può dire se il range è stato completato.
  daVerificare: boolean
}

// Volume: peso × ripetizioni, sommati. Le serie senza peso non contano.
export function volumeSerie(serie: SerieRegistrata[]): number {
  return serie.reduce((totale, s) => totale + (s.pesoKg ?? 0) * s.ripetizioni, 0)
}

// Miglior massimale stimato fra le serie con peso. Null se nessuna serie ha un peso.
export function miglioreRM(serie: SerieRegistrata[]): number | null {
  const stime = serie.flatMap((s) => (s.pesoKg === null ? [] : [stimaRM(s.pesoKg, s.ripetizioni)]))
  return stime.length === 0 ? null : Math.max(...stime)
}

// Peso più alto tra le serie. Null se nessuna serie ha un peso.
export function massimoKg(serie: SerieRegistrata[]): number | null {
  const pesi = serie.flatMap((s) => (s.pesoKg === null ? [] : [s.pesoKg]))
  return pesi.length === 0 ? null : Math.max(...pesi)
}

// Carichi da proporre al prossimo allenamento. Solo per gli esercizi con "carico a salire" nella scheda.
export function suggerisciCarichi(
  esercizi: Esercizio[],
  ultime: UltimeVolte,
): Record<string, SuggerimentoCarico> {
  const suggerimenti: Record<string, SuggerimentoCarico> = {}

  for (const esercizio of esercizi) {
    const { obiettivo, incrementoKg } = esercizio
    const ultima = ultime[esercizio.id]
    if (!ultima || obiettivo.tipo !== 'serie' || incrementoKg === undefined) continue

    const serie = ultima.serie.flatMap((s) =>
      s.pesoKg === null ? [] : [{ peso: s.pesoKg, ripetizioni: s.ripetizioni }],
    )
    if (serie.length === 0) continue
    const massimo = Math.max(...serie.map((s) => s.peso))

    if (ultima.datiIniziali) {
      suggerimenti[esercizio.id] = { kg: massimo, aumenta: false, ripMax: obiettivo.ripMax, daVerificare: true }
      continue
    }

    const kg = prossimoCarico(serie, obiettivo.ripMax, incrementoKg)
    if (kg === null) continue
    suggerimenti[esercizio.id] = { kg, aumenta: kg > massimo, ripMax: obiettivo.ripMax, daVerificare: false }
  }
  return suggerimenti
}

// Valori suggeriti per la serie numero `indice` (da 0): quelli della stessa serie dell'ultima volta,
// oppure dell'ultima serie fatta. Se le ripetizioni dell'ultima volta non sono state registrate davvero
// (dati iniziali), si suggerisce il target della scheda, non un numero che sembri misurato.
export function suggerimentoSerie(
  precedenti: SerieRegistrata[],
  indice: number,
  ripTarget: number | null,
  ripAffidabili: boolean,
): { pesoKg: number | null; ripetizioni: number | null } {
  const base = precedenti[indice] ?? precedenti[precedenti.length - 1]
  const dallaStoria = ripAffidabili ? (base?.ripetizioni ?? null) : null
  return {
    pesoKg: base?.pesoKg ?? null,
    ripetizioni: dallaStoria ?? ripTarget,
  }
}

export type RigaRecord = { esercizioId: string; nome: string; pesoKg: number | null; data: Date }
export type RecordEsercizio = { esercizioId: string; nome: string; pesoKg: number; data: Date }

// Il peso più alto per ogni esercizio, con la data in cui è stato raggiunto per la prima volta.
export function calcolaRecord(righe: RigaRecord[]): RecordEsercizio[] {
  const migliori = new Map<string, RecordEsercizio>()
  for (const riga of righe) {
    if (riga.pesoKg === null) continue
    const attuale = migliori.get(riga.esercizioId)
    const superato = !attuale || riga.pesoKg > attuale.pesoKg
    const pariMaPiuVecchio = attuale && riga.pesoKg === attuale.pesoKg && riga.data < attuale.data
    if (superato || pariMaPiuVecchio) {
      migliori.set(riga.esercizioId, {
        esercizioId: riga.esercizioId,
        nome: riga.nome,
        pesoKg: riga.pesoKg,
        data: riga.data,
      })
    }
  }
  return [...migliori.values()].sort((a, b) => a.nome.localeCompare(b.nome, 'it'))
}
