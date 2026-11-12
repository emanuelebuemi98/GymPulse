// Forma della scheda dentro l'app. La scheda vera vive nel database (una per persona) e si modifica da
// Scheda → Personalizza: qui ci sono solo i tipi con cui il codice la legge e la scrive.

// Recupero in secondi, carico in kg.
// `ripSerie`: le ripetizioni di ogni serie, quando sono diverse (12, 10, 8, 6): c'è solo in quel caso, e ha tante voci quante sono le
// serie. In quel caso `ripMin` e `ripMax` sono il minimo e il massimo della lista. Senza, le ripetizioni sono le stesse per tutte.
export type Obiettivo = { tipo: 'serie'; serie: number; ripMin: number; ripMax: number; recuperoSec: number; ripSerie?: number[] }

// Un gruppo di esercizi consecutivi senza pausa tra uno e l'altro: superset (2), triset (3), gigantset (4 o più). `numero` è uguale per
// tutti gli esercizi del gruppo (1, 2, ... nella giornata) e `recuperoSec` è il recupero dopo ogni giro, uguale per tutti.
export type Gruppo = { numero: number; recuperoSec: number }

export type Esercizio = {
  id: number
  nome: string
  // Il nome inglese, piccolo sotto il nome, e la categoria ('petto' oppure vuota). Vuoti per gli esercizi personali.
  nomeEn: string
  // Il percorso dell'immagine ('/esercizi/barbell-bench-press.jpg') o vuoto se per l'esercizio non ce n'è una.
  immagine: string
  categoria: string
  // La voce del catalogo a cui l'esercizio è collegato, solo da leggere: serve a mostrare il «Come si fa» anche a chi non è il
  // proprietario dell'esercizio (il personal trainer), perché foto e testi sono del catalogo, uguali per tutti.
  catalogoRif: number | null
  obiettivo: Obiettivo
  nota?: string
  // Incremento proposto quando il range è completato su tutte le serie.
  incrementoKg?: number
  // Presente solo per un esercizio che fa parte di un superset, triset o gigantset.
  gruppo?: Gruppo
}

export type Giorno = {
  id: string // sigla: A, B, C
  titolo: string
  esercizi: Esercizio[]
  // Chi ha modificato la giornata per ultimo e quando (ISO). Vuoto se non è mai stata modificata dopo la creazione.
  // `daAltri`: a modificarla è stato qualcun altro (un personal trainer) e non la persona a cui appartiene la scheda; `da` è
  // il suo nome completo (vuoto se quell'account non esiste più).
  modificata?: { da: string | null; il: string; daAltri: boolean }
}
