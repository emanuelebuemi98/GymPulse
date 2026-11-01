// Le giornate della scheda: da 1 a 7 a persona, ciascuna con una sigla che è una lettera (A, B, C, ...).
// Funzioni pure, senza database, così si usano anche nei componenti del browser.

export const GIORNATE_MASSIME = 7

const PRIMA = 'A'.charCodeAt(0)
const ULTIMA = 'Z'.charCodeAt(0)

export function titoloGiornata(sigla: string): string {
  return `Giornata ${sigla}`
}

// La sigla di una giornata nuova: la lettera dopo la più alta già usata, comprese le giornate tolte dalla scheda ma
// rimaste per lo storico (non si riusano, o le vecchie sedute cambierebbero giornata). Una giornata nuova va sempre in
// fondo. Null se le lettere sono finite.
export function prossimaSigla(esistenti: string[]): string | null {
  const lettere = esistenti.filter((sigla) => /^[A-Z]$/.test(sigla)).map((sigla) => sigla.charCodeAt(0))
  const prossima = lettere.length === 0 ? PRIMA : Math.max(...lettere) + 1
  return prossima > ULTIMA ? null : String.fromCharCode(prossima)
}
