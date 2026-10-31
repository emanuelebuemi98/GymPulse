// Calcoli per gli assi dei grafici: valori minimo e massimo e tick a numeri tondi. Funzioni pure, senza DOM.

export type Asse = { min: number; max: number; tick: number[] }

// Passo "tondo" (1, 2 o 5 per una potenza di 10) che copre `grezzo`.
export function passoTondo(grezzo: number): number {
  if (!(grezzo > 0)) return 1
  const potenza = 10 ** Math.floor(Math.log10(grezzo))
  const rapporto = grezzo / potenza
  const tondo = rapporto <= 1 ? 1 : rapporto <= 2 ? 2 : rapporto <= 5 ? 5 : 10
  return tondo * potenza
}

function tickDa(min: number, max: number, passo: number): number[] {
  const intervalli = Math.round((max - min) / passo)
  return Array.from({ length: intervalli + 1 }, (_, i) => Number((min + i * passo).toFixed(6)))
}

// Asse Y per le linee, con un margine sopra e sotto i valori. Il minimo non scende sotto zero.
export function asseY(valori: number[], tickDesiderati = 4): Asse {
  if (valori.length === 0) throw new Error("Serve almeno un valore per l'asse")
  const minimo = Math.min(...valori)
  const massimo = Math.max(...valori)
  const margine = (massimo - minimo) * 0.15 || massimo * 0.1 || 1
  const basso = Math.max(0, minimo - margine)
  const alto = massimo + margine
  const passo = passoTondo((alto - basso) / tickDesiderati)
  const min = Math.floor(basso / passo) * passo
  const max = Math.ceil(alto / passo) * passo
  return { min, max, tick: tickDa(min, max, passo) }
}

const GIORNO_MS = 86_400_000

// Asse del tempo per le linee: i punti stanno dove cadono le date, quindi una pausa si vede come un vuoto.
// I tick sono al massimo 5, equidistanti nel tempo; con meno di un giorno di distanza ce n'è uno solo, perché
// due etichette gg/mm cadrebbero nello stesso giorno. Con un punto solo il dominio si allarga di qualche giorno.
export function asseTempo(istanti: number[]): { dominio: [number, number]; tick: number[] } {
  if (istanti.length === 0) throw new Error("Serve almeno un istante per l'asse")
  const minimo = Math.min(...istanti)
  const massimo = Math.max(...istanti)
  if (minimo === massimo) return { dominio: [minimo - 3 * GIORNO_MS, massimo + 3 * GIORNO_MS], tick: [minimo] }

  const giorni = Math.floor((massimo - minimo) / GIORNO_MS)
  const quanti = Math.min(5, giorni + 1)
  if (quanti < 2) return { dominio: [minimo, massimo], tick: [minimo] }
  const tick = Array.from({ length: quanti }, (_, i) => minimo + ((massimo - minimo) * i) / (quanti - 1))
  return { dominio: [minimo, massimo], tick }
}

// Asse Y per le barre: parte sempre da zero, perché la lunghezza della barra è il dato.
// `passoMinimo` = 1 per i conteggi, così non compaiono tick come 0,5 sedute.
export function asseBarre(valori: number[], tickDesiderati = 4, passoMinimo = 0): Asse {
  const massimo = Math.max(0, ...valori)
  const passo = Math.max(passoMinimo, passoTondo(massimo / tickDesiderati))
  const max = Math.max(passo, Math.ceil(massimo / passo) * passo)
  return { min: 0, max, tick: tickDa(0, max, passo) }
}
