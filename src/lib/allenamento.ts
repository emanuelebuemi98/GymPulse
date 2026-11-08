import { dataIso } from './formato'
import { lunediDi } from './panoramica'
import type { Obiettivo } from './scheda-tipi'

export type SerieEseguita = { peso: number; ripetizioni: number }

// Indice del giorno da proporre dopo l'ultimo allenamento (null = nessuno storico).
export function indiceGiornoSuccessivo(ultimoIndice: number | null, totaleGiorni: number): number {
  if (totaleGiorni <= 0) throw new Error('La scheda deve avere almeno un giorno')
  if (ultimoIndice === null) return 0
  return (ultimoIndice + 1) % totaleGiorni
}

// Giornata da proporre. Ogni settimana (da lunedì, ora di Roma) riparte dalla prima: se l'ultima seduta è di una
// settimana precedente, o non ce ne sono, si propone la prima. Dentro la settimana si segue l'ordine, cioè la
// giornata dopo l'ultima registrata. Se l'ultima non è più nella scheda, si riparte dalla prima.
export function giornoConsigliato<T extends { id: string }>(
  giorni: T[],
  ultima: { giornoId: string; data: Date } | null,
  oggi = new Date(),
): T {
  if (ultima === null || dataIso(ultima.data) < lunediDi(dataIso(oggi))) return giorni[0]

  const indice = giorni.findIndex((giorno) => giorno.id === ultima.giornoId)
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

// Il recupero tra le serie di un esercizio, per la scheda: "recupero 2 min". Vuoto se l'esercizio non ne ha (a ripetizioni
// totali o a serie libere) oppure è zero.
export function descrizioneRecupero(obiettivo: Obiettivo): string | null {
  return obiettivo.tipo === 'serie' && obiettivo.recuperoSec > 0 ? `recupero ${formatRecupero(obiettivo.recuperoSec)}` : null
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

export type RiepilogoGiornata = {
  esercizi: number
  serie: number
  // Una stima, non un dato misurato: ogni serie dura circa 40 secondi e si aggiunge il recupero previsto tra una serie e
  // l'altra (non dopo l'ultima). Null se nessun esercizio ha serie con un recupero da contare.
  minutiStimati: number | null
  categorie: string[]
}

const SECONDI_PER_SERIE = 40

// Quante serie ha una giornata e quanto può durare, più le categorie che lavora (senza ripetizioni, nell'ordine in cui
// compaiono). Gli esercizi a ripetizioni totali o a serie libere non hanno un numero fisso di serie: si contano per
// l'estremo più basso.
export function riepilogoGiornata(
  esercizi: { categoria: string; obiettivo: Obiettivo }[],
): RiepilogoGiornata {
  let serie = 0
  let secondi = 0
  let conTempo = false
  for (const { obiettivo } of esercizi) {
    if (obiettivo.tipo === 'serie') {
      serie += obiettivo.serie
      secondi += obiettivo.serie * SECONDI_PER_SERIE + Math.max(0, obiettivo.serie - 1) * obiettivo.recuperoSec
      conTempo = true
    } else if (obiettivo.tipo === 'libero') {
      serie += obiettivo.serieMin
    } else {
      serie += 1
    }
  }
  const categorie = [...new Set(esercizi.map((esercizio) => esercizio.categoria).filter((categoria) => categoria !== ''))]
  return { esercizi: esercizi.length, serie, minutiStimati: conTempo ? Math.max(1, Math.round(secondi / 60)) : null, categorie }
}
