import { titoloGiornata } from './giornate'
import { validaNuoveCredenziali } from './sessione-auth'

// Registrazione aperta: chiunque può creare un account dall'app. Non c'è un codice di invito, quindi le difese sono:
// campi controllati con rigore, una pausa dopo ogni errore, il limite di tentativi per indirizzo (vedi lib/limite.ts)
// e l'email obbligatoria, confermata con un codice prima che l'account esista (vedi lib/codici-email.ts).

export const LUNGHEZZA_MIN_NOME = 2
export const LUNGHEZZA_MAX_NOME = 80

// Nome completo, normalizzato: spazi ai lati tolti, spazi interni ridotti a uno, forma Unicode composta (NFC).
export function normalizzaNomeCompleto(testo: string): string {
  return testo.normalize('NFC').trim().replace(/\s+/g, ' ')
}

// Lettere (anche accentate) e, dentro il nome, apostrofo, trattino, punto e spazio. Niente numeri né simboli:
// il nome viene mostrato in pagina, quindi si evita qualunque carattere che non sia parte di un nome.
const FORMATO_NOME = /^\p{L}[\p{L}\p{M}' .-]*$/u

export function validaNomeCompleto(nome: string): string | null {
  if (nome.length < LUNGHEZZA_MIN_NOME) return 'Scrivi il tuo nome completo'
  if (nome.length > LUNGHEZZA_MAX_NOME) return `Il nome è troppo lungo (massimo ${LUNGHEZZA_MAX_NOME} caratteri)`
  if (!FORMATO_NOME.test(nome)) return 'Il nome può contenere solo lettere, spazi, apostrofi e trattini'
  return null
}

// Controlli sul modulo di registrazione. Nome e username vanno già normalizzati. Restituisce il problema, o null.
export function validaRegistrazione(nome: string, username: string, password: string, conferma: string): string | null {
  const problemaNome = validaNomeCompleto(nome)
  if (problemaNome) return problemaNome
  const problemaCredenziali = validaNuoveCredenziali(username, password)
  if (problemaCredenziali) return problemaCredenziali
  if (password !== conferma) return 'Le due password non coincidono'
  return null
}

export type GiornataVuota = { id: string; titolo: string }

// Ogni persona parte con tre giornate vuote (A, B, C) da riempire con la propria scheda. Sono solo il punto di partenza:
// dalla pagina Scheda se ne aggiungono (fino a 7) e se ne tolgono (fino a una sola).
export function giornateVuote(): GiornataVuota[] {
  return ['A', 'B', 'C'].map((id) => ({ id, titolo: titoloGiornata(id) }))
}

// Errore di Prisma per un valore che deve essere unico (es. nome utente già preso).
export function èViolazioneUnicita(errore: unknown): boolean {
  return typeof errore === 'object' && errore !== null && 'code' in errore && errore.code === 'P2002'
}
