// Forma della scheda dentro l'app. La scheda vera vive nel database (una per persona) e si modifica da
// Scheda → Personalizza: qui ci sono solo i tipi con cui il codice la legge e la scrive.

// Recupero in secondi, carico in kg.
export type Obiettivo =
  | { tipo: 'serie'; serie: number; ripMin: number; ripMax: number; recuperoSec: number }
  | { tipo: 'totale'; ripTotali: number }
  | { tipo: 'libero'; serieMin: number; serieMax: number }

export type Esercizio = {
  id: string
  nome: string
  muscoli: string
  obiettivo: Obiettivo
  nota?: string
  // Incremento proposto quando il range è completato su tutte le serie.
  incrementoKg?: number
}

export type Giorno = {
  id: string // sigla: A, B, C
  numero: number
  titolo: string
  focus: string
  esercizi: Esercizio[]
}
