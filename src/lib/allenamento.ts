import type { Obiettivo } from './scheda-tipi'

// Valore intermedio dell'intervallo 3,5–6 per il sollevamento pesi.
export const MET_PESI = 5

export type SerieEseguita = { peso: number; ripetizioni: number }

// Indice del giorno da proporre dopo l'ultimo allenamento (null = nessuno storico).
export function indiceGiornoSuccessivo(ultimoIndice: number | null, totaleGiorni: number): number {
  if (totaleGiorni <= 0) throw new Error('La scheda deve avere almeno un giorno')
  if (ultimoIndice === null) return 0
  return (ultimoIndice + 1) % totaleGiorni
}

// Giornata da proporre dopo l'ultima registrata. Se l'ultima non è più nella scheda, si riparte dalla prima.
export function giornoConsigliato<T extends { id: string }>(giorni: T[], ultimoId: string | null): T {
  const indice = ultimoId === null ? -1 : giorni.findIndex((giorno) => giorno.id === ultimoId)
  return giorni[indiceGiornoSuccessivo(indice === -1 ? null : indice, giorni.length)]
}

// Carico suggerito: se ogni serie ha raggiunto il massimo del range, aggiunge l'incremento.
// Restituisce null se non c'è ancora uno storico.
export function prossimoCarico(
  serie: SerieEseguita[],
  ripMax: number,
  incrementoKg: number,
): number | null {
  if (serie.length === 0) return null
  const pesoMassimo = Math.max(...serie.map((s) => s.peso))
  const completata = serie.every((s) => s.ripetizioni >= ripMax)
  return completata ? pesoMassimo + incrementoKg : pesoMassimo
}

// Stima del massimale con la formula di Epley: peso × (1 + ripetizioni / 30).
export function stimaRM(peso: number, ripetizioni: number): number {
  if (ripetizioni < 1) throw new Error('Le ripetizioni devono essere almeno 1')
  return peso * (1 + ripetizioni / 30)
}

// Calorie stimate: MET × peso corporeo (kg) × durata (ore). È una stima, non una misura.
export function stimaKcal(pesoCorporeoKg: number, durataMinuti: number, met = MET_PESI): number {
  return Math.round(met * pesoCorporeoKg * (durataMinuti / 60))
}

export function descrizioneObiettivo(obiettivo: Obiettivo): string {
  switch (obiettivo.tipo) {
    case 'serie':
      return obiettivo.ripMin === obiettivo.ripMax
        ? `${obiettivo.serie} × ${obiettivo.ripMin}`
        : `${obiettivo.serie} × ${obiettivo.ripMin}-${obiettivo.ripMax}`
    case 'totale':
      return `${obiettivo.ripTotali} ripetizioni totali`
    case 'libero':
      return obiettivo.serieMin === obiettivo.serieMax
        ? `${obiettivo.serieMin} serie`
        : `${obiettivo.serieMin}-${obiettivo.serieMax} serie`
  }
}

export function formatRecupero(secondi: number): string {
  const minuti = Math.floor(secondi / 60)
  const resto = secondi % 60
  if (minuti === 0) return `${resto} s`
  if (resto === 0) return `${minuti} min`
  return `${minuti} min ${resto} s`
}

// Conto alla rovescia, come su un timer: 90 → "1:30".
export function formatTimer(secondi: number): string {
  const minuti = Math.floor(secondi / 60)
  const resto = secondi % 60
  return `${minuti}:${String(resto).padStart(2, '0')}`
}

// Serie da mostrare all'inizio di una sessione per un esercizio con questo obiettivo.
export function serieIniziali(obiettivo: Obiettivo): number {
  switch (obiettivo.tipo) {
    case 'serie':
      return obiettivo.serie
    case 'libero':
      return obiettivo.serieMin
    case 'totale':
      return 3
  }
}

// Ripetizioni a cui puntare in ogni serie. Null se l'obiettivo non le fissa.
export function ripetizioniTarget(obiettivo: Obiettivo): number | null {
  return obiettivo.tipo === 'serie' ? obiettivo.ripMax : null
}
