import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto'

// Password archiviate con scrypt, che è già in Node: nessuna libreria in più. Nel database finisce
// una stringa "scrypt$N$r$p$sale$chiave" che contiene anche i parametri usati, così si potranno alzare
// in futuro senza invalidare gli hash esistenti. La password in chiaro non viene mai salvata né registrata.

const COSTO = { n: 2 ** 15, r: 8, p: 1 }
const LUNGHEZZA_CHIAVE = 32
const LUNGHEZZA_SALE = 16

// Limiti accettati in lettura: un hash con parametri assurdi non deve poter bloccare il server.
const N_MIN = 2 ** 10
const N_MAX = 2 ** 17

export type CostoScrypt = { n: number; r: number; p: number }

function deriva(password: string, sale: Buffer, { n, r, p }: CostoScrypt, lunghezza: number): Promise<Buffer> {
  return new Promise((risolvi, rifiuta) => {
    // NFKC: la stessa password scritta con tastiere diverse dà lo stesso hash.
    scrypt(password.normalize('NFKC'), sale, lunghezza, { N: n, r, p, maxmem: 256 * n * r * p }, (errore, chiave) =>
      errore ? rifiuta(errore) : risolvi(chiave),
    )
  })
}

export async function creaHashPassword(password: string, costo: CostoScrypt = COSTO): Promise<string> {
  const sale = randomBytes(LUNGHEZZA_SALE)
  const chiave = await deriva(password, sale, costo, LUNGHEZZA_CHIAVE)
  return ['scrypt', costo.n, costo.r, costo.p, sale.toString('base64url'), chiave.toString('base64url')].join('$')
}

// Falso per qualunque hash malformato: chi chiama non deve gestire eccezioni.
export async function verificaPassword(password: string, archiviato: string): Promise<boolean> {
  const parti = archiviato.split('$')
  if (parti.length !== 6 || parti[0] !== 'scrypt') return false

  const [, nTesto, rTesto, pTesto, saleTesto, chiaveTesto] = parti
  const costo = { n: Number(nTesto), r: Number(rTesto), p: Number(pTesto) }
  const potenzaDiDue = Number.isInteger(costo.n) && (costo.n & (costo.n - 1)) === 0
  if (!potenzaDiDue || costo.n < N_MIN || costo.n > N_MAX) return false
  if (!Number.isInteger(costo.r) || costo.r < 1 || costo.r > 16) return false
  if (!Number.isInteger(costo.p) || costo.p < 1 || costo.p > 4) return false

  const sale = Buffer.from(saleTesto, 'base64url')
  const atteso = Buffer.from(chiaveTesto, 'base64url')
  if (sale.length < 8 || atteso.length < 16 || atteso.length > 64) return false

  try {
    const calcolata = await deriva(password, sale, costo, atteso.length)
    return calcolata.length === atteso.length && timingSafeEqual(calcolata, atteso)
  } catch {
    return false
  }
}

// Hash di una password casuale, calcolato una volta sola. Quando il nome utente non esiste si verifica
// comunque contro questo hash, così la risposta impiega lo stesso tempo e non rivela se l'utente c'è.
let fittizio: Promise<string> | undefined
export function hashFittizio(): Promise<string> {
  fittizio ??= creaHashPassword(randomBytes(16).toString('hex'))
  return fittizio
}
