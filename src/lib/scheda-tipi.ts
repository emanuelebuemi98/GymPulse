// Forma della scheda dentro l'app. La scheda vera vive nel database (una per persona) e si modifica da
// Scheda → Personalizza: qui ci sono solo i tipi con cui il codice la legge e la scrive.

// Recupero in secondi, carico in kg.
export type Obiettivo =
  | { tipo: 'serie'; serie: number; ripMin: number; ripMax: number; recuperoSec: number }
  | { tipo: 'totale'; ripTotali: number }
  | { tipo: 'libero'; serieMin: number; serieMax: number }

export type Esercizio = {
  id: number
  nome: string
  // Il nome inglese, piccolo sotto il nome, e la categoria ('petto' oppure vuota). Vuoti per gli esercizi personali.
  nomeEn: string
  // Il percorso dell'immagine ('/esercizi/barbell-bench-press.jpg') o vuoto se per l'esercizio non ce n'è una.
  immagine: string
  categoria: string
  obiettivo: Obiettivo
  nota?: string
  // Incremento proposto quando il range è completato su tutte le serie.
  incrementoKg?: number
}

export type Giorno = {
  id: string // sigla: A, B, C
  titolo: string
  esercizi: Esercizio[]
}
