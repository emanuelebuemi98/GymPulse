// Formati per date e numeri in italiano. Le date usano il fuso di Roma, così server e browser mostrano la stessa data.
const FUSO_ITALIA = 'Europe/Rome'

const formatoData = new Intl.DateTimeFormat('it-IT', {
  timeZone: FUSO_ITALIA,
  day: 'numeric',
  month: 'short',
  year: 'numeric',
})

export function formatData(data: Date): string {
  return formatoData.format(data)
}

export function formatNumero(valore: number, decimali = 1): string {
  return valore.toLocaleString('it-IT', { maximumFractionDigits: decimali })
}
