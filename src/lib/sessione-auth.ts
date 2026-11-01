import { createHmac, timingSafeEqual } from 'node:crypto'

// Sessione dell'accesso: un cookie firmato con AUTH_SECRET che contiene solo la scadenza.
// Nome utente e password (hash) stanno nella tabella User; qui ci sono solo funzioni pure
// (segreto e orologio passati dal chiamante), così si provano senza server.

export const COOKIE_SESSIONE = 'gympulse_sessione'
export const DURATA_SESSIONE_SEC = 30 * 24 * 60 * 60
export const LUNGHEZZA_MIN_SEGRETO = 32
export const LUNGHEZZA_MIN_PASSWORD = 10
export const LUNGHEZZA_MAX_PASSWORD = 200

const VERSIONE = 'v3'

export type EsitoSegreto = { ok: true; segreto: string } | { ok: false; problema: string }

// Senza un segreto valido l'accesso resta chiuso: non esiste una modalità "aperta" per dimenticanza.
export function valutaSegreto(segreto: string | undefined): EsitoSegreto {
  if (!segreto) return { ok: false, problema: 'AUTH_SECRET non è impostata' }
  if (segreto.length < LUNGHEZZA_MIN_SEGRETO) {
    return { ok: false, problema: `AUTH_SECRET è troppo corta (minimo ${LUNGHEZZA_MIN_SEGRETO} caratteri)` }
  }
  return { ok: true, segreto }
}

// Il nome utente non distingue maiuscole né spazi ai lati (le tastiere dei telefoni mettono la maiuscola da sole).
export function normalizzaUsername(testo: string): string {
  return testo.trim().toLowerCase()
}

const FORMATO_USERNAME = /^[a-z0-9][a-z0-9._-]{2,29}$/

// Regole per scegliere una password nuova (alla registrazione, al cambio e al recupero). Restituisce il problema,
// o null se va bene. Il nome utente va già normalizzato.
export function validaNuovaPassword(username: string, password: string): string | null {
  if (password.length < LUNGHEZZA_MIN_PASSWORD) {
    return `La password deve avere almeno ${LUNGHEZZA_MIN_PASSWORD} caratteri`
  }
  if (password.length > LUNGHEZZA_MAX_PASSWORD) {
    return `La password è troppo lunga (massimo ${LUNGHEZZA_MAX_PASSWORD} caratteri)`
  }
  if (password.toLowerCase() === username) return 'La password non può essere uguale al nome utente'
  return null
}

// Regole per scegliere nome utente e password alla registrazione. Restituisce il problema, o null se vanno bene.
export function validaNuoveCredenziali(username: string, password: string): string | null {
  if (!FORMATO_USERNAME.test(username)) {
    return 'Il nome utente deve avere da 3 a 30 caratteri: lettere minuscole, numeri, punto, trattino o underscore'
  }
  return validaNuovaPassword(username, password)
}

function firma(contenuto: string, segreto: string): string {
  return createHmac('sha256', segreto).update(contenuto).digest('base64url')
}

// Token del cookie: "v3.<id utente>.<scadenza in ms>.<firma>". L'id è un numero intero positivo. Non c'è altro:
// né nome né password. Cambiare la versione fa scadere i token vecchi.
export function creaToken(
  segreto: string,
  userId: number,
  adesso = Date.now(),
  durataSec = DURATA_SESSIONE_SEC,
): string {
  if (!Number.isSafeInteger(userId) || userId < 1) throw new Error('Id utente non valido')
  const contenuto = `${VERSIONE}.${userId}.${adesso + durataSec * 1000}`
  return `${contenuto}.${firma(contenuto, segreto)}`
}

// L'id dell'utente a cui appartiene il token, oppure null se il token non è valido, è scaduto
// o è stato alterato. È l'unica fonte di "chi sta facendo la richiesta": mai fidarsi di un id mandato dal browser.
export function idUtenteDaToken(
  token: string | undefined,
  segreto: string | undefined,
  adesso = Date.now(),
): number | null {
  if (!token || !segreto || segreto.length < LUNGHEZZA_MIN_SEGRETO) return null

  const parti = token.split('.')
  if (parti.length !== 4) return null
  const [versione, idTesto, scadenza, firmaRicevuta] = parti
  if (versione !== VERSIONE || !/^\d{1,15}$/.test(scadenza) || !/^[1-9]\d{0,9}$/.test(idTesto)) return null

  const attesa = Buffer.from(firma(`${versione}.${idTesto}.${scadenza}`, segreto))
  const ricevuta = Buffer.from(firmaRicevuta)
  if (attesa.length !== ricevuta.length || !timingSafeEqual(attesa, ricevuta)) return null
  if (Number(scadenza) <= adesso) return null

  const id = Number(idTesto)
  return Number.isSafeInteger(id) ? id : null
}

export function tokenValido(token: string | undefined, segreto: string | undefined, adesso = Date.now()): boolean {
  return idUtenteDaToken(token, segreto, adesso) !== null
}

// Dove tornare dopo il login. Solo percorsi interni: un indirizzo come "//sito.com" o "/\sito.com"
// porterebbe fuori dall'app (open redirect).
export function percorsoSicuro(da: unknown): string {
  if (typeof da !== 'string' || da.length === 0 || da.length > 500) return '/'
  if (!da.startsWith('/') || da.startsWith('//') || da.includes('\\')) return '/'
  if (/[\u0000-\u001f\u007f]/.test(da)) return '/'
  if (da === '/login' || da.startsWith('/login?') || da.startsWith('/login/')) return '/'
  return da
}
