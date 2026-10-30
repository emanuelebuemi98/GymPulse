// Converte il testo di un campo del form. La virgola è accettata come separatore decimale.
export function parseNumero(testo: string): number | null {
  const pulito = testo.trim().replace(',', '.')
  if (pulito === '') return null
  const valore = Number(pulito)
  return Number.isFinite(valore) ? valore : null
}

export function parseIntero(testo: string): number | null {
  const valore = parseNumero(testo)
  return valore !== null && Number.isInteger(valore) ? valore : null
}
