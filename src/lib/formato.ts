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

export function formatNumero(valore: number, decimali = 1): string {
  return valore.toLocaleString('it-IT', { maximumFractionDigits: decimali })
}
