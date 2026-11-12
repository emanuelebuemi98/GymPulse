// Formati per date e numeri in italiano. Le date usano il fuso di Roma, così server e browser mostrano la stessa data.
const FUSO_ITALIA = 'Europe/Rome'

const formato = (opzioni: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat('it-IT', { timeZone: FUSO_ITALIA, ...opzioni })

const formatoData = formato({ day: 'numeric', month: 'short', year: 'numeric' })
const formatoLunga = formato({ weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
const formatoNumerica = formato({ day: '2-digit', month: '2-digit', year: 'numeric' })
const formatoBreve = formato({ day: '2-digit', month: '2-digit' })
const formatoIso = new Intl.DateTimeFormat('en-GB', {
  timeZone: FUSO_ITALIA,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

// 28 ott 2026
export function formatData(data: Date): string {
  return formatoData.format(data)
}

// Mercoledì 28 Ottobre 2026
export function formatDataLunga(data: Date): string {
  return formatoLunga.format(data).replace(/(^|\s)(\p{L})/gu, (_, spazio: string, lettera: string) => {
    return spazio + lettera.toUpperCase()
  })
}

// 28/10/2026
export function formatDataNumerica(data: Date): string {
  return formatoNumerica.format(data)
}

// 28/10
export function formatDataBreve(data: Date): string {
  return formatoBreve.format(data)
}

// 2026-10-28: il valore che si aspetta un campo <input type="date">.
export function dataIso(data: Date): string {
  const parti = Object.fromEntries(formatoIso.formatToParts(data).map((parte) => [parte.type, parte.value]))
  return `${parti.year}-${parti.month}-${parti.day}`
}

// Istante da salvare per una data scelta nel form. Per oggi vale l'ora attuale, così due
// allenamenti dello stesso giorno restano in ordine. Per un altro giorno vale il mezzogiorno UTC,
// che a Roma cade sempre nello stesso giorno. Null se la data non esiste o è nel futuro.
export function istanteDaData(data: string, ora = new Date()): Date | null {
  const trovato = /^(\d{4})-(\d{2})-(\d{2})$/.exec(data)
  if (!trovato) return null

  const [anno, mese, giorno] = [Number(trovato[1]), Number(trovato[2]), Number(trovato[3])]
  const mezzogiorno = new Date(Date.UTC(anno, mese - 1, giorno, 12))
  const esiste =
    mezzogiorno.getUTCFullYear() === anno &&
    mezzogiorno.getUTCMonth() === mese - 1 &&
    mezzogiorno.getUTCDate() === giorno
  if (!esiste || anno < 2000) return null

  const oggi = dataIso(ora)
  if (data > oggi) return null
  return data === oggi ? ora : mezzogiorno
}

const formatoOra = new Intl.DateTimeFormat('en-GB', {
  timeZone: FUSO_ITALIA,
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
})

// Il primo istante dopo `istante` in cui a Roma è mezzanotte, cioè l'inizio del giorno successivo. Si legge l'orologio
// di Roma e non quello del server (su Vercel è in UTC), e regge l'ora legale: i giorni di 23 e 25 ore finiscono comunque
// a mezzanotte, perché il cambio d'ora avviene di notte, tra le 2 e le 3, mai a mezzanotte.
export function mezzanotteSuccessiva(istante: Date): Date {
  const oggi = dataIso(istante)
  const [anno, mese, giorno] = oggi.split('-').map(Number)
  const domani = dataIso(new Date(Date.UTC(anno, mese - 1, giorno + 1, 12)))
  // La mezzanotte di Roma cade 1 ora (inverno) o 2 ore (estate) prima della mezzanotte UTC dello stesso giorno.
  const mezzanotteUtc = Date.UTC(anno, mese - 1, giorno + 1)
  for (const ore of [1, 2]) {
    const candidato = new Date(mezzanotteUtc - ore * 3_600_000)
    if (formatoOra.format(candidato) === '00:00' && dataIso(candidato) === domani) return candidato
  }
  // Non dovrebbe succedere: si ripiega su 24 ore, che è comunque una scadenza sicura.
  return new Date(istante.getTime() + 24 * 3_600_000)
}

// Tempo trascorso, come su un cronometro: 754 → "12:34", 3912 → "1:05:12".
export function formatTrascorso(secondi: number): string {
  const totale = Math.max(0, Math.floor(secondi))
  const ore = Math.floor(totale / 3600)
  const minuti = Math.floor((totale % 3600) / 60)
  const resto = String(totale % 60).padStart(2, '0')
  return ore > 0 ? `${ore}:${String(minuti).padStart(2, '0')}:${resto}` : `${minuti}:${resto}`
}

// Durata di una seduta in ore, minuti e secondi, per lo storico: 45 → "45 s", 754 → "12 min 34 s", 3912 → "1 h 5 min 12 s".
// Si parte dall'unità più grande che serve e si arriva sempre ai secondi.
export function formatDurata(secondi: number): string {
  const totale = Math.max(0, Math.round(secondi))
  const ore = Math.floor(totale / 3600)
  const minuti = Math.floor((totale % 3600) / 60)
  const resto = totale % 60
  if (ore > 0) return `${ore} h ${minuti} min ${resto} s`
  if (minuti > 0) return `${minuti} min ${resto} s`
  return `${resto} s`
}

export function formatNumero(valore: number, decimali = 1): string {
  return valore.toLocaleString('it-IT', { maximumFractionDigits: decimali })
}
