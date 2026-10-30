// Un parametro dell'indirizzo può arrivare come testo, come elenco o mancare del tutto.
export function primoParametro(valore: string | string[] | undefined): string | undefined {
  return Array.isArray(valore) ? valore[0] : valore
}
