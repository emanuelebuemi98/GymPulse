// La durata di una seduta, in secondi. Il server rifiuta quelle oltre le 10 ore: è il limite di `durataSchema`.
export const DURATA_MASSIMA_SECONDI = 10 * 3600

// I secondi da salvare: il tempo trascorso dall'inizio della sessione, di almeno 1. Nessuna durata (null) se non c'è un'ora
// di inizio, se la seduta è di un altro giorno (si sta registrando un allenamento passato: il cronometro misurerebbe il
// tempo passato a compilare, non l'allenamento) o se supera il limite (una sessione lasciata aperta per ore non deve
// salvare un dato falso).
export function secondiDaTimer(inizio: number | null, adesso: number, dataSeduta: string, oggi: string): number | null {
  if (inizio === null || dataSeduta !== oggi) return null
  const secondi = Math.max(1, Math.round((adesso - inizio) / 1000))
  return secondi <= DURATA_MASSIMA_SECONDI ? secondi : null
}
