import { createHash, timingSafeEqual } from 'node:crypto'
import { validaNuoveCredenziali } from './sessione-auth'

// Registrazione di una nuova persona. Per non lasciare l'app aperta a chiunque conosca l'indirizzo,
// serve un codice di invito (CODICE_INVITO nelle variabili d'ambiente) che dai tu a chi vuoi.
// Senza il codice impostato le registrazioni sono chiuse.

export const LUNGHEZZA_MIN_CODICE = 8
export const LUNGHEZZA_MAX_CODICE = 100

export type EsitoCodice = { ok: true; codice: string } | { ok: false }

export function valutaCodiceInvito(env: string | undefined): EsitoCodice {
  const codice = env?.trim()
  return codice && codice.length >= LUNGHEZZA_MIN_CODICE ? { ok: true, codice } : { ok: false }
}

const impronta = (testo: string) => createHash('sha256').update(testo).digest()

// Confronto a tempo costante: non rivela quanti caratteri iniziali erano giusti.
export function codiceInvitoCorretto(inserito: unknown, atteso: string): boolean {
  if (typeof inserito !== 'string' || inserito.length > LUNGHEZZA_MAX_CODICE) return false
  return timingSafeEqual(impronta(inserito.trim()), impronta(atteso))
}

// Controlli sul modulo di registrazione. Il nome utente va già normalizzato. Restituisce il problema, o null.
export function validaRegistrazione(username: string, password: string, conferma: string): string | null {
  const problema = validaNuoveCredenziali(username, password)
  if (problema) return problema
  if (password !== conferma) return 'Le due password non coincidono'
  return null
}

export type GiornataVuota = { id: string; numero: number; titolo: string; focus: string }

// Ogni persona parte con tre giornate vuote (A, B, C) da riempire con la propria scheda.
export function giornateVuote(): GiornataVuota[] {
  return ['A', 'B', 'C'].map((id, indice) => ({ id, numero: indice + 1, titolo: `Giornata ${id}`, focus: '' }))
}

// Errore di Prisma per un valore che deve essere unico (es. nome utente già preso).
export function èViolazioneUnicita(errore: unknown): boolean {
  return typeof errore === 'object' && errore !== null && 'code' in errore && errore.code === 'P2002'
}
