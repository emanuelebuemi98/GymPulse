// I carichi dell'ultima settimana, copiati dagli appunti. Servono a precompilare i suggerimenti.
//
// Le ripetizioni NON sono state registrate (negli appunti ci sono solo i kg): per ogni esercizio
// vale il numero scritto negli appunti ("3x8" → 8) oppure, se manca, il minimo del range della scheda.
// Per questo la sessione è marcata "datiIniziali" e l'app le mostra come "da verificare".
// Fa eccezione l'addome alla sbarra, dove gli appunti riportano le ripetizioni (15 15 20 = 50 totali).
//
// DATE: gli appunti non le riportano. Le ho prese dallo storico dell'app del collega
// (A = lunedì 26/10, B = mercoledì 28/10, C = venerdì 23/10): sono un'ipotesi, non un dato tuo.
// Se non sono giuste, cambiale qui e rifai il caricamento (vedi il README, sezione Dati iniziali).

export type EsercizioIniziale = {
  esercizioId: string
  kg: number[] | null // null per gli esercizi a corpo libero
  rip: number | number[] // un numero per tutte le serie, oppure uno per ogni serie
}

export type SessioneIniziale = {
  id: string
  giornoId: 'A' | 'B' | 'C'
  data: string // AAAA-MM-GG
  esercizi: EsercizioIniziale[]
}

export const sessioniIniziali: SessioneIniziale[] = [
  {
    id: 'iniziale-C',
    giornoId: 'C',
    data: '2026-10-23',
    esercizi: [
      { esercizioId: 'stacco-terra', kg: [20, 30, 40], rip: 5 },
      { esercizioId: 'lat-machine-avanti', kg: [40, 45, 50, 50], rip: 8 },
      { esercizioId: 'pulley-basso', kg: [40, 40, 40], rip: 10 },
      { esercizioId: 'pullover-manubrio', kg: [20, 20, 20], rip: 10 },
      { esercizioId: 'rematore-petto-panca', kg: [12.5, 12.5, 12.5], rip: 12 },
      { esercizioId: 'lento-avanti-manubri', kg: [12.5, 12.5, 14], rip: 8 },
      { esercizioId: 'alzate-laterali', kg: [7, 7, 7], rip: 10 },
      { esercizioId: 'addome-giorno-3', kg: [40, 40, 45, 50], rip: 15 },
    ],
  },
  {
    id: 'iniziale-A',
    giornoId: 'A',
    data: '2026-10-26',
    esercizi: [
      { esercizioId: 'panca-piana', kg: [40, 50, 50, 50], rip: 6 },
      { esercizioId: 'panca-inclinata-manubri', kg: [12.5, 14, 14], rip: 8 },
      { esercizioId: 'croci-cavi-30', kg: [15, 15, 17.5, 17.5], rip: 10 },
      { esercizioId: 'lat-presa-inversa', kg: [40, 45, 45], rip: 8 },
      { esercizioId: 'curl-ez', kg: [25, 25, 25, 25], rip: 8 },
      { esercizioId: 'curl-manubri', kg: [10, 10, 10], rip: 8 },
      { esercizioId: 'dip-macchina', kg: [25, 30, 37.5], rip: 10 },
    ],
  },
  {
    id: 'iniziale-B',
    giornoId: 'B',
    data: '2026-10-28',
    esercizi: [
      { esercizioId: 'squat-bilanciere', kg: [50, 60, 70, 75], rip: 6 },
      { esercizioId: 'pressa-45', kg: [120, 150, 160], rip: 12 },
      { esercizioId: 'leg-extension', kg: [35, 35, 40], rip: 15 },
      { esercizioId: 'leg-curl-sdraiato', kg: [30, 35, 35, 40], rip: 10 },
      { esercizioId: 'leg-curl-seduto', kg: [40, 45, 50], rip: 12 },
      { esercizioId: 'calf-piedi', kg: [110, 110, 130, 130], rip: 15 },
      { esercizioId: 'addome-giorno-2', kg: null, rip: [15, 15, 20] },
    ],
  },
]
