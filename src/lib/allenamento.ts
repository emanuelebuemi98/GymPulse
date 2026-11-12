import { dataIso } from './formato'
import { lunediDi } from './panoramica'
import type { Gruppo, Obiettivo } from './scheda-tipi'

export type SerieEseguita = { peso: number; ripetizioni: number }

// Indice del giorno da proporre dopo l'ultimo allenamento (null = nessuno storico).
export function indiceGiornoSuccessivo(ultimoIndice: number | null, totaleGiorni: number): number {
  if (totaleGiorni <= 0) throw new Error('La scheda deve avere almeno un giorno')
  if (ultimoIndice === null) return 0
  return (ultimoIndice + 1) % totaleGiorni
}

// Giornata da proporre. Ogni settimana (da lunedì, ora di Roma) riparte dalla prima: se l'ultima seduta è di una
// settimana precedente, o non ce ne sono, si propone la prima. Dentro la settimana si propone la prima giornata che non è
// ancora stata fatta (`fatte` sono le sigle fatte da lunedì): così una giornata saltata non si perde, e se si fa la C prima
// della B, dopo la C si propone la B. Se sono già tutte fatte si segue l'ordine, cioè la giornata dopo l'ultima registrata
// (se l'ultima non è più nella scheda, si riparte dalla prima).
export function giornoConsigliato<T extends { id: string }>(
  giorni: T[],
  ultima: { giornoId: string; data: Date } | null,
  fatte: string[],
  oggi = new Date(),
): T {
  if (ultima === null || dataIso(ultima.data) < lunediDi(dataIso(oggi))) return giorni[0]

  const giaFatte = new Set(fatte)
  const nonFatta = giorni.find((giorno) => !giaFatte.has(giorno.id))
  if (nonFatta) return nonFatta

  const indice = giorni.findIndex((giorno) => giorno.id === ultima.giornoId)
  return giorni[indiceGiornoSuccessivo(indice === -1 ? null : indice, giorni.length)]
}

// Carico suggerito: se ogni serie ha raggiunto il suo obiettivo di ripetizioni, aggiunge l'incremento. L'obiettivo è un numero
// solo (il massimo del range, uguale per tutte le serie) oppure un elenco, uno per serie (12, 10, 8, 6): in quel caso la serie
// numero N si confronta con l'N-esimo valore.
// Restituisce null se non c'è ancora uno storico.
export function prossimoCarico(
  serie: SerieEseguita[],
  ripObiettivo: number | number[],
  incrementoKg: number,
): number | null {
  if (serie.length === 0) return null
  const pesoMassimo = Math.max(...serie.map((s) => s.peso))
  const completata = serie.every(
    (s, i) => s.ripetizioni >= (Array.isArray(ripObiettivo) ? obiettivoSerie(ripObiettivo, i) : ripObiettivo),
  )
  return completata ? pesoMassimo + incrementoKg : pesoMassimo
}

// L'obiettivo di ripetizioni della serie numero `indice` (da 0) quando ogni serie ha il suo. Se si fanno più serie del previsto
// vale l'ultimo valore.
function obiettivoSerie(ripSerie: number[], indice: number): number {
  return ripSerie[Math.min(indice, ripSerie.length - 1)]
}

export function descrizioneObiettivo(obiettivo: Obiettivo): string {
  // Ripetizioni diverse per ogni serie: "4 × 12-10-8-6".
  if (obiettivo.ripSerie) return `${obiettivo.serie} × ${obiettivo.ripSerie.join('-')}`
  return obiettivo.ripMin === obiettivo.ripMax
    ? `${obiettivo.serie} × ${obiettivo.ripMin}`
    : `${obiettivo.serie} × ${obiettivo.ripMin}-${obiettivo.ripMax}`
}

// Il recupero tra le serie di un esercizio, per la scheda: "recupero 2 min". Vuoto se è zero.
export function descrizioneRecupero(obiettivo: Obiettivo): string | null {
  return obiettivo.recuperoSec > 0 ? `recupero ${formatRecupero(obiettivo.recuperoSec)}` : null
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
  return obiettivo.serie
}

// Ripetizioni a cui puntare nella serie numero `indice` (da 0): il massimo del range, oppure il valore di quella serie quando ogni
// serie ha il suo (la serie piramidale).
export function ripetizioniTarget(obiettivo: Obiettivo, indice = 0): number {
  return obiettivo.ripSerie ? obiettivoSerie(obiettivo.ripSerie, indice) : obiettivo.ripMax
}

// Vero se l'esercizio è a serie piramidale, cioè con ripetizioni diverse per ogni serie: in quel caso il piano le fissa e il segnaposto è il
// suo valore.
export function haRipetizioniPerSerie(obiettivo: Obiettivo): boolean {
  return obiettivo.ripSerie !== undefined
}

export type RiepilogoGiornata = {
  esercizi: number
  serie: number
  // Una stima, non un dato misurato: ogni serie dura circa 40 secondi e si aggiunge il recupero previsto tra una serie e
  // l'altra (non dopo l'ultima). Null se la giornata non ha esercizi.
  minutiStimati: number | null
  categorie: string[]
}

const SECONDI_PER_SERIE = 40

// Quante serie ha una giornata e quanto può durare, più le categorie che lavora (senza ripetizioni, nell'ordine in cui
// compaiono).
export function riepilogoGiornata(
  esercizi: { categoria: string; obiettivo: Obiettivo; gruppo?: Gruppo }[],
): RiepilogoGiornata {
  let serie = 0
  let secondi = 0
  // Gli esercizi di una super serie si fanno uno dopo l'altro senza pausa: il recupero c'è una volta per giro (dopo l'ultimo
  // esercizio), non dopo ciascuno. I giri sono quanti ne fa l'esercizio con più serie.
  const giriGruppo = new Map<number, { giri: number; recuperoSec: number }>()
  for (const { obiettivo, gruppo } of esercizi) {
    if (gruppo) {
      const attuale = giriGruppo.get(gruppo.numero)
      giriGruppo.set(gruppo.numero, { giri: Math.max(attuale?.giri ?? 0, obiettivo.serie), recuperoSec: gruppo.recuperoSec })
    }
  }
  for (const { giri, recuperoSec } of giriGruppo.values()) secondi += Math.max(0, giri - 1) * recuperoSec

  for (const { obiettivo, gruppo } of esercizi) {
    serie += obiettivo.serie
    secondi += obiettivo.serie * SECONDI_PER_SERIE + (gruppo ? 0 : Math.max(0, obiettivo.serie - 1) * obiettivo.recuperoSec)
  }
  const categorie = [...new Set(esercizi.map((esercizio) => esercizio.categoria).filter((categoria) => categoria !== ''))]
  return { esercizi: esercizi.length, serie, minutiStimati: esercizi.length > 0 ? Math.max(1, Math.round(secondi / 60)) : null, categorie }
}
