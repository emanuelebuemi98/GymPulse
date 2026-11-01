import { cache } from 'react'
import { cookies, headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { db } from './db'
import {
  COOKIE_SESSIONE,
  INTESTAZIONE_PERCORSO,
  creaToken,
  improntaGiusta,
  leggiToken,
  scadenzaSessione,
} from './sessione-auth'

// Apre la sessione: cookie firmato con l'id numerico dell'utente e l'impronta della sua password. "secure" solo su
// https (Vercel manda x-forwarded-proto): su http locale il browser scarterebbe il cookie.
// Vale fino alla prossima mezzanotte di Roma (maxAge): il browser lo tiene anche se lo chiudi, e la stessa scadenza è
// scritta nel token. L'istante è uno solo, usato per entrambi: a cavallo della mezzanotte non possono differire.
export async function apriSessione(segreto: string, userId: number, passwordHash: string): Promise<void> {
  const archivio = await cookies()
  const èHttps = (await headers()).get('x-forwarded-proto') === 'https'
  const adesso = Date.now()
  archivio.set(COOKIE_SESSIONE, creaToken(segreto, userId, passwordHash, adesso), {
    httpOnly: true,
    sameSite: 'lax',
    secure: èHttps,
    path: '/',
    maxAge: Math.max(1, Math.round((scadenzaSessione(adesso) - adesso) / 1000)),
  })
}

// Chi sta facendo la richiesta, ricavato dal cookie firmato E dal database: il token vale solo se l'impronta della
// password che porta è ancora quella della persona. Cambiando la password, ogni sessione aperta smette di valere.
// È l'unica fonte dell'id dell'utente: pagine e azioni non si fidano mai di un id mandato dal browser.
// `cache` fa una sola lettura del database per richiesta, anche se menu, pagina e dati la chiedono più volte.
export const utenteCorrente = cache(async (): Promise<number | null> => {
  const segreto = process.env.AUTH_SECRET
  const archivio = await cookies()
  const dati = leggiToken(archivio.get(COOKIE_SESSIONE)?.value, segreto)
  if (!dati || !segreto) return null

  const riga = await db.user.findUnique({ where: { id: dati.userId }, select: { passwordHash: true } })
  if (!riga || !improntaGiusta(segreto, riga.passwordHash, dati.impronta)) return null
  return dati.userId
})

export type UtenteDellaPagina = { userId: number } | { errore: string; scaduta?: true }

const SESSIONE_SCADUTA = 'Sessione scaduta: accedi di nuovo e riprova (la sessione in corso è salvata nel browser).'
const ACCOUNT_CAMBIATO =
  'In un’altra scheda di questo browser hai fatto l’accesso con un altro account, quindi non ho salvato niente. Ricarica la pagina; le serie confermate restano nel telefono: per riprenderle esci e rientra con l’account giusto.'

// Per le azioni che scrivono. Il browser ha un solo cookie di accesso per tutte le sue schede: se in una scheda si accede
// con un altro account, una pagina rimasta aperta su quello di prima scriverebbe nell'account nuovo. Ogni pagina quindi
// manda l'id dell'account per cui è stata disegnata, e qui si rifiuta tutto se non coincide con quello del cookie.
// Il confronto serve solo a RIFIUTARE: l'utente vero resta sempre quello del cookie, mai quello dichiarato dalla pagina.
export async function utenteDellaPagina(atteso: unknown): Promise<UtenteDellaPagina> {
  const userId = await utenteCorrente()
  if (!userId) return { errore: SESSIONE_SCADUTA, scaduta: true }
  if (atteso !== userId) return { errore: ACCOUNT_CAMBIATO }
  return { userId }
}

export async function haAccesso(): Promise<boolean> {
  return (await utenteCorrente()) !== null
}

// Per le pagine e per i dati: chi non è entrato va al login. Restituisce l'id da usare in ogni query.
// Il proxy ferma già chi non è entrato, ma non basta da solo: pagine e azioni sono punti d'ingresso pubblici.
export async function richiediUtente(): Promise<number> {
  const id = await utenteCorrente()
  if (!id) {
    // Dopo l'accesso si torna dove si era (l'indirizzo lo scrive il proxy; la pagina di login lo ricontrolla).
    const percorso = (await headers()).get(INTESTAZIONE_PERCORSO)
    redirect(percorso ? `/login?da=${encodeURIComponent(percorso)}` : '/login')
  }
  return id
}
