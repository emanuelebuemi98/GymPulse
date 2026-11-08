import { createHmac, timingSafeEqual } from 'node:crypto'

// Sessione dell'accesso: un cookie firmato con AUTH_SECRET che contiene l'id dell'utente, una scadenza e
// un'impronta della sua password. Nome utente e password (hash) stanno nella tabella User; qui ci sono solo
// funzioni pure (segreto e orologio passati dal chiamante), così si provano senza server.
//
// La sessione vale fino alla prossima mezzanotte di Roma, sia sul cookie sia nel token. Così chi si allena ogni sera
// ma a orari un po' diversi (17:30 un giorno, 18:30 l'altro) accede quando comincia e non viene mai buttato fuori a
// metà: con una durata di 24 ore dall'accesso, entrare alle 18:00 farebbe scadere la sessione del giorno dopo alle 18:00,
// proprio durante l'allenamento. Chiudere il browser per sbaglio non fa uscire, e un cookie copiato non vale oltre la
// giornata. Se scade lo stesso a metà allenamento (si supera la mezzanotte) la sessione di allenamento non si perde: sta
// nel browser (lib/bozza.ts) e si riprende dopo aver riaccesso.

import { mezzanotteSuccessiva } from './formato'

export const COOKIE_SESSIONE = 'gympulse_sessione'
export const INTESTAZIONE_PERCORSO = 'x-gympulse-percorso'
export const LUNGHEZZA_MIN_SEGRETO = 32
export const LUNGHEZZA_MIN_PASSWORD = 8
export const LUNGHEZZA_MAX_PASSWORD = 200

const VERSIONE = 'v4'
const LUNGHEZZA_IMPRONTA = 22

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

// Impronta della password di una persona. Cambia a ogni cambio di password: l'hash scrypt ha un sale nuovo anche se la
// password scelta è la stessa. Essendo un HMAC calcolato con il segreto, non permette di risalire né alla password né
// all'hash. Scritta nel token, fa scadere tutte le sessioni aperte appena la password cambia.
export function improntaPassword(segreto: string, passwordHash: string): string {
  return createHmac('sha256', segreto).update(`impronta|${passwordHash}`).digest('base64url').slice(0, LUNGHEZZA_IMPRONTA)
}

// Vero se l'impronta scritta nel token è quella della password che la persona ha adesso.
export function improntaGiusta(segreto: string, passwordHash: string, impronta: string): boolean {
  const attesa = Buffer.from(improntaPassword(segreto, passwordHash))
  const ricevuta = Buffer.from(impronta)
  return attesa.length === ricevuta.length && timingSafeEqual(attesa, ricevuta)
}

// Quando scade una sessione aperta in `adesso`: alla prossima mezzanotte di Roma, in millisecondi. Cookie e token
// usano questo stesso valore, calcolato una volta sola da chi apre la sessione.
export function scadenzaSessione(adesso = Date.now()): number {
  return mezzanotteSuccessiva(new Date(adesso)).getTime()
}

// Token del cookie: "v4.<id utente>.<scadenza in ms>.<impronta della password>.<firma>". L'id è un numero intero
// positivo. Non c'è altro: né nome né password. Cambiare la versione fa scadere i token vecchi.
export function creaToken(segreto: string, userId: number, passwordHash: string, adesso = Date.now()): string {
  if (!Number.isSafeInteger(userId) || userId < 1) throw new Error('Id utente non valido')
  const contenuto = `${VERSIONE}.${userId}.${scadenzaSessione(adesso)}.${improntaPassword(segreto, passwordHash)}`
  return `${contenuto}.${firma(contenuto, segreto)}`
}

export type DatiToken = { userId: number; impronta: string }

// Cosa dice un token, oppure null se non è valido, è scaduto o è stato alterato. Controlla solo il token: che la
// password sia ancora quella lo verifica utenteCorrente() contro il database. È l'unica fonte di "chi sta facendo la
// richiesta": mai fidarsi di un id mandato dal browser.
export function leggiToken(token: string | undefined, segreto: string | undefined, adesso = Date.now()): DatiToken | null {
  if (!token || !segreto || segreto.length < LUNGHEZZA_MIN_SEGRETO) return null

  const parti = token.split('.')
  if (parti.length !== 5) return null
  const [versione, idTesto, scadenza, impronta, firmaRicevuta] = parti
  if (versione !== VERSIONE || !/^\d{1,15}$/.test(scadenza) || !/^[1-9]\d{0,9}$/.test(idTesto)) return null
  if (!new RegExp(`^[A-Za-z0-9_-]{${LUNGHEZZA_IMPRONTA}}$`).test(impronta)) return null

  const attesa = Buffer.from(firma(`${versione}.${idTesto}.${scadenza}.${impronta}`, segreto))
  const ricevuta = Buffer.from(firmaRicevuta)
  if (attesa.length !== ricevuta.length || !timingSafeEqual(attesa, ricevuta)) return null
  if (Number(scadenza) <= adesso) return null

  const userId = Number(idTesto)
  return Number.isSafeInteger(userId) ? { userId, impronta } : null
}

// Prima porta (proxy): firma e scadenza, senza database. Un token con la password cambiata passa di qui e viene
// fermato subito dopo, da pagine e azioni, che controllano anche l'impronta.
export function tokenValido(token: string | undefined, segreto: string | undefined, adesso = Date.now()): boolean {
  return leggiToken(token, segreto, adesso) !== null
}

// Dove tornare dopo il login. Solo percorsi interni: un indirizzo come "//sito.com" o "/\sito.com"
// porterebbe fuori dall'app (open redirect). Se non c'è un posto valido si va alla home dell'app (/home), non alla
// presentazione (/), che serve a chi non è ancora entrato.
export function percorsoSicuro(da: unknown): string {
  if (typeof da !== 'string' || da.length === 0 || da.length > 500) return '/home'
  if (!da.startsWith('/') || da.startsWith('//') || da.includes('\\')) return '/home'
  if (/[\u0000-\u001f\u007f]/.test(da)) return '/home'
  if (da === '/' || da === '/login' || da.startsWith('/login?') || da.startsWith('/login/')) return '/home'
  return da
}
