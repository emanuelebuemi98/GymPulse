import type { Esercizio } from './scheda-tipi'
import { prossimoCarico } from './allenamento'
import { formatNumero } from './formato'
import type { SerieRegistrata, UltimeVolte } from './tipi'

export type SuggerimentoCarico = {
  kg: number
  aumenta: boolean
  ripMax: number
  // Le ripetizioni da raggiungere in ogni serie quando sono diverse per serie (12, 10, 8, 6); assente se sono le stesse per tutte.
  ripSerie?: number[]
  // Le ripetizioni dell'ultima volta non sono state registrate davvero: non si può dire se il range è stato completato.
  daVerificare: boolean
}

// Volume: peso × ripetizioni, sommati. Le serie senza peso non contano.
export function volumeSerie(serie: SerieRegistrata[]): number {
  return serie.reduce((totale, s) => totale + (s.pesoKg ?? 0) * s.ripetizioni, 0)
}

// Peso totale: i kg di ogni serie sommati, senza moltiplicare per le ripetizioni (serie da 120, 150 e 160 kg → 430).
// Le serie senza peso non contano.
export function pesoTotaleKg(serie: SerieRegistrata[]): number {
  return serie.reduce((totale, s) => totale + (s.pesoKg ?? 0), 0)
}

// Come si arriva a una somma, a parole: "25 × 4" per quattro serie da 25, "120 + 150 + 160" per serie diverse,
// "25 × 4 + 30 × 2" quando ci sono blocchi uguali di seguito.
export function descriviSomma(valori: number[]): string {
  const blocchi: { valore: number; volte: number }[] = []
  for (const valore of valori) {
    const ultimo = blocchi[blocchi.length - 1]
    if (ultimo && ultimo.valore === valore) ultimo.volte += 1
    else blocchi.push({ valore, volte: 1 })
  }
  return blocchi
    .map(({ valore, volte }) => (volte === 1 ? formatNumero(valore, 2) : `${formatNumero(valore, 2)} × ${volte}`))
    .join(' + ')
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
    if (!ultima || incrementoKg === undefined) continue

    const serie = ultima.serie.flatMap((s) =>
      s.pesoKg === null ? [] : [{ peso: s.pesoKg, ripetizioni: s.ripetizioni }],
    )
    if (serie.length === 0) continue
    const massimo = Math.max(...serie.map((s) => s.peso))

    if (ultima.datiIniziali) {
      suggerimenti[esercizio.id] = { kg: massimo, aumenta: false, ripMax: obiettivo.ripMax, ripSerie: obiettivo.ripSerie, daVerificare: true }
      continue
    }

    const kg = prossimoCarico(serie, obiettivo.ripSerie ?? obiettivo.ripMax, incrementoKg)
    if (kg === null) continue
    suggerimenti[esercizio.id] = { kg, aumenta: kg > massimo, ripMax: obiettivo.ripMax, ripSerie: obiettivo.ripSerie, daVerificare: false }
  }
  return suggerimenti
}

// Valori suggeriti per la serie numero `indice` (da 0): quelli della stessa serie dell'ultima volta,
// oppure dell'ultima serie fatta. Se le ripetizioni dell'ultima volta non sono state registrate davvero
// (dati iniziali), si suggerisce il target della scheda, non un numero che sembri misurato.
// Se la scheda fissa le ripetizioni di ogni serie (12, 10, 8, 6), il segnaposto è quello della serie e non quello dell'ultima volta:
// il peso invece resta quello dell'ultima volta.
export function suggerimentoSerie(
  precedenti: SerieRegistrata[],
  indice: number,
  ripTarget: number | null,
  ripAffidabili: boolean,
  ripFisse = false,
): { pesoKg: number | null; ripetizioni: number | null } {
  const base = precedenti[indice] ?? precedenti[precedenti.length - 1]
  const dallaStoria = ripAffidabili && !(ripFisse && ripTarget !== null) ? (base?.ripetizioni ?? null) : null
  return {
    pesoKg: base?.pesoKg ?? null,
    ripetizioni: dallaStoria ?? ripTarget,
  }
}

export type RigaRecord = { esercizioId: number; nome: string; pesoKg: number | null; data: Date }
export type RecordEsercizio = { esercizioId: number; nome: string; pesoKg: number; data: Date }

// Il peso più alto per ogni esercizio, con la data in cui è stato raggiunto per la prima volta.
export function calcolaRecord(righe: RigaRecord[]): RecordEsercizio[] {
  const migliori = new Map<number, RecordEsercizio>()
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
