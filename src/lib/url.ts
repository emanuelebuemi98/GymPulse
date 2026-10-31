// Un parametro dell'indirizzo può arrivare come testo, come elenco o mancare del tutto.
export function primoParametro(valore: string | string[] | undefined): string | undefined {
  return Array.isArray(valore) ? valore[0] : valore
}

const ID_MASSIMO = 2_147_483_647

// Un id numerico dall'indirizzo: solo cifre, senza zeri iniziali, nei limiti di un intero del database.
// Qualunque altra cosa ("12abc", "1e3", "-4", "0", "007") vale null, quindi pagina non trovata.
export function idDaParametro(valore: string | string[] | undefined): number | null {
  const testo = primoParametro(valore)
  if (testo === undefined || !/^[1-9]\d{0,9}$/.test(testo)) return null
  const id = Number(testo)
  return id <= ID_MASSIMO ? id : null
}
