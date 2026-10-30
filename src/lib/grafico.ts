// Calcoli per i grafici SVG: assi, tick e posizioni. Funzioni pure, senza DOM.

export type Asse = { min: number; max: number; tick: number[] }

// Passo "tondo" (1, 2 o 5 per una potenza di 10) che copre `grezzo`.
export function passoTondo(grezzo: number): number {
  if (!(grezzo > 0)) return 1
  const potenza = 10 ** Math.floor(Math.log10(grezzo))
  const rapporto = grezzo / potenza
  const tondo = rapporto <= 1 ? 1 : rapporto <= 2 ? 2 : rapporto <= 5 ? 5 : 10
  return tondo * potenza
}

// Asse Y con un margine sopra e sotto i valori e tick a numeri tondi. Il minimo non scende sotto zero.
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
  const intervalli = Math.round((max - min) / passo)
  const tick = Array.from({ length: intervalli + 1 }, (_, i) => Number((min + i * passo).toFixed(6)))
  return { min, max, tick }
}

// Proietta un valore dal dominio [dMin, dMax] sull'intervallo [pMin, pMax]. Può essere invertito, come per l'asse Y.
export function posizione(valore: number, dMin: number, dMax: number, pMin: number, pMax: number): number {
  if (dMax === dMin) return (pMin + pMax) / 2
  return pMin + ((valore - dMin) / (dMax - dMin)) * (pMax - pMin)
}

// Indice del punto più vicino alla coordinata x: serve al mirino che segue il puntatore.
export function indiceVicino(x: number, xs: number[]): number {
  let migliore = 0
  for (let i = 1; i < xs.length; i++) {
    if (Math.abs(xs[i] - x) < Math.abs(xs[migliore] - x)) migliore = i
  }
  return migliore
}

// Indici dei punti da etichettare sull'asse X, senza che due etichette si tocchino.
// Le posizioni (in pixel, crescenti) seguono il tempo, quindi non sono equidistanti.
// Ancoraggio: il primo punto a sinistra, l'ultimo a destra, gli altri al centro.
export function indiciEtichette(posizioni: number[], larghezze: number[], spazio = 8): number[] {
  const n = posizioni.length
  if (n === 0) return []

  const scatola = (i: number): [number, number] => {
    const l = larghezze[i]
    if (n === 1) return [posizioni[i] - l / 2, posizioni[i] + l / 2]
    if (i === 0) return [posizioni[i], posizioni[i] + l]
    if (i === n - 1) return [posizioni[i] - l, posizioni[i]]
    return [posizioni[i] - l / 2, posizioni[i] + l / 2]
  }

  // Primo passaggio: da sinistra, tiene ogni etichetta che lascia lo spazio minimo.
  const scelti: number[] = []
  let fineUltima = -Infinity
  for (let i = 0; i < n; i++) {
    const [sinistra, destra] = scatola(i)
    if (sinistra >= fineUltima + spazio) {
      scelti.push(i)
      fineUltima = destra
    }
  }

  // L'ultima data è la più recente: se è rimasta fuori, toglie le etichette che la toccano.
  if (n > 1 && scelti[scelti.length - 1] !== n - 1) {
    const [sinistraUltima] = scatola(n - 1)
    while (scelti.length > 0 && scatola(scelti[scelti.length - 1])[1] + spazio > sinistraUltima) {
      scelti.pop()
    }
    scelti.push(n - 1)
  }
  return scelti
}
