import { BATTITO_MAX, BATTITO_MIN } from './orologio'

// Lettura di un file TCX (Training Center XML): il formato di esportazione che molte app degli orologi hanno in comune.
// Si legge nel browser, con il lettore XML del browser stesso: il file non arriva mai al server, che riceve solo i
// numeri e li ricontrolla. Gli elementi sono quelli dello schema pubblicato da Garmin (TrainingCenterDatabase v2).

export type DatiTcx = {
  inizio: Date | null
  durataMinuti: number | null
  fcMediaBpm: number | null
  fcMassimaBpm: number | null
  kcalOrologio: number | null
}

export type EsitoTcx = { ok: true; dati: DatiTcx } | { ok: false; errore: string }

export const LIMITE_TCX = 25_000_000 // caratteri: una seduta di un'ora con un punto al secondo ne ha meno di un milione

const errore = (messaggio: string): EsitoTcx => ({ ok: false, errore: messaggio })

const figli = (elemento: Element, nome: string) =>
  Array.from(elemento.children).filter((figlio) => figlio.localName === nome)

function numeroDi(elemento: Element | undefined): number | null {
  if (!elemento) return null
  // I battiti sono scritti <HeartRateBpm><Value>120</Value></HeartRateBpm>: il numero sta nel figlio.
  const testo = (figli(elemento, 'Value')[0] ?? elemento).textContent?.trim() ?? ''
  const numero = Number(testo)
  return testo !== '' && Number.isFinite(numero) ? numero : null
}

const battitoValido = (n: number | null): n is number => n !== null && n >= BATTITO_MIN && n <= BATTITO_MAX

function dataDa(testo: string | null | undefined): Date | null {
  if (!testo) return null
  const data = new Date(testo.trim())
  return Number.isNaN(data.getTime()) ? null : data
}

export function leggiTcx(testo: string): EsitoTcx {
  if (testo.length > LIMITE_TCX) return errore('Il file è troppo grande')
  // Un TCX non ha mai definizioni di entità: chi le scrive sta cercando di far lavorare il lettore a vuoto.
  if (/<!DOCTYPE|<!ENTITY/i.test(testo)) return errore('Il file non è un TCX valido')

  const documento = new DOMParser().parseFromString(testo, 'application/xml')
  if (documento.getElementsByTagName('parsererror').length > 0) return errore('Il file non è un XML valido')
  const radice = documento.documentElement
  if (radice.localName !== 'TrainingCenterDatabase') {
    return errore('Il file non è un TCX: serve un file esportato come "TCX" dall\'app dell\'orologio')
  }

  const attivita = figli(radice, 'Activities').flatMap((elenco) => figli(elenco, 'Activity'))
  if (attivita.length === 0) return errore("Il file non contiene un'attività da leggere")
  if (attivita.length > 1) return errore("Il file contiene più attività: esporta solo quella dell'allenamento")
  const giri = figli(attivita[0], 'Lap')
  if (giri.length === 0) return errore("L'attività non ha dati: manca il giro (Lap)")

  let secondi = 0
  let kcal = 0
  let massimo: number | null = null
  const medieDeiGiri: { secondi: number; media: number }[] = []
  let sommaCampioni = 0
  let numeroCampioni = 0

  for (const giro of giri) {
    const secondiGiro = numeroDi(figli(giro, 'TotalTimeSeconds')[0]) ?? 0
    if (secondiGiro > 0) secondi += secondiGiro

    const calorie = numeroDi(figli(giro, 'Calories')[0])
    if (calorie !== null && calorie > 0) kcal += calorie

    const media = numeroDi(figli(giro, 'AverageHeartRateBpm')[0])
    if (battitoValido(media)) medieDeiGiri.push({ secondi: secondiGiro, media })
    const massimoGiro = numeroDi(figli(giro, 'MaximumHeartRateBpm')[0])
    if (battitoValido(massimoGiro)) massimo = Math.max(massimo ?? 0, massimoGiro)

    for (const traccia of figli(giro, 'Track')) {
      for (const punto of figli(traccia, 'Trackpoint')) {
        const battito = numeroDi(figli(punto, 'HeartRateBpm')[0])
        if (!battitoValido(battito)) continue
        sommaCampioni += battito
        numeroCampioni += 1
        massimo = Math.max(massimo ?? 0, battito)
      }
    }
  }

  // La media che l'orologio calcola per ogni giro vale più della media dei punti, che sono a intervalli irregolari.
  // Si pesa sulla durata del giro; se manca in qualche giro si ripiega sui punti.
  let media: number | null = null
  if (medieDeiGiri.length === giri.length) {
    const pesoTotale = medieDeiGiri.reduce((somma, giro) => somma + giro.secondi, 0)
    media =
      pesoTotale > 0
        ? medieDeiGiri.reduce((somma, giro) => somma + giro.media * giro.secondi, 0) / pesoTotale
        : medieDeiGiri.reduce((somma, giro) => somma + giro.media, 0) / medieDeiGiri.length
  } else if (numeroCampioni > 0) {
    media = sommaCampioni / numeroCampioni
  } else if (medieDeiGiri.length > 0) {
    media = medieDeiGiri.reduce((somma, giro) => somma + giro.media, 0) / medieDeiGiri.length
  }

  const fcMediaBpm = media === null ? null : Math.round(media)
  const dati: DatiTcx = {
    inizio: dataDa(figli(attivita[0], 'Id')[0]?.textContent) ?? dataDa(giri[0].getAttribute('StartTime')),
    durataMinuti: secondi >= 30 ? Math.max(1, Math.round(secondi / 60)) : null,
    fcMediaBpm,
    // La massima non può stare sotto la media: succede solo se il file è incoerente.
    fcMassimaBpm: massimo === null ? null : Math.max(Math.round(massimo), fcMediaBpm ?? 0),
    kcalOrologio: kcal > 0 ? Math.round(kcal) : null,
  }

  if (dati.durataMinuti === null && dati.fcMediaBpm === null && dati.kcalOrologio === null) {
    return errore('Nel file non ho trovato né durata, né battiti, né calorie')
  }
  return { ok: true, dati }
}
