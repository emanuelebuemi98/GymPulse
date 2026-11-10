'use server'

import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'
import { eliminaDatiUtente } from '@/lib/account-eliminazione'
import { utenteDellaPagina } from '@/lib/accesso'
import {
  MESSAGGI_RIFIUTO,
  annullaCodiceEmail,
  controllaCodiceEmail,
  creaCodiceEmail,
  invalidaCodiciEmail,
} from '@/lib/codici-email'
import { db } from '@/lib/db'
import { emailAttiva, inviaEmail } from '@/lib/email'
import { mascheraEmail, normalizzaEmail } from '@/lib/indirizzo-email'
import { creaLimite, testoLimite } from '@/lib/limite'
import { messaggioCodice } from '@/lib/otp'
import { verificaPassword } from '@/lib/password'
import { COOKIE_SESSIONE, LUNGHEZZA_MAX_PASSWORD, valutaSegreto } from '@/lib/sessione-auth'

// Lo stato del modulo dell'email. `email` è l'indirizzo in attesa di conferma, già mascherato.
export type StatoEmail = {
  passo: 'indirizzo' | 'codice'
  errore: string | null
  messaggio: string | null
  email: string | null
}

const PAUSA_DOPO_ERRORE_MS = 800
const pausa = (ms: number) => new Promise((risolvi) => setTimeout(risolvi, ms))

const INDIRIZZO: StatoEmail = { passo: 'indirizzo', errore: null, messaggio: null, email: null }
const errore = (testo: string, passo: StatoEmail['passo'] = 'indirizzo', email: string | null = null): StatoEmail => ({
  passo,
  errore: testo,
  messaggio: null,
  email,
})

// Per persona e non per indirizzo: chi ha rubato un cookie di sessione non deve poter indovinare la password per
// cambiare l'email del recupero. Si conta ogni controllo della password.
const limitePassword = creaLimite(5, 15 * 60 * 1000)

// Collega o cambia l'email per il recupero della password. Un solo modulo, tre azioni (campo "azione"):
//   invia     → controlla la password e manda il codice all'indirizzo scritto;
//   conferma  → controlla il codice e salva l'indirizzo;
//   annulla   → torna al primo passo.
// L'email non si può togliere, solo sostituire: senza, una password dimenticata non si recupera più.
// La password serve perché l'email è la chiave per cambiare la password: la sola sessione non basta.
export async function gestisciEmail(_precedente: StatoEmail, dati: FormData): Promise<StatoEmail> {
  // La pagina manda l'id dell'account per cui è stata disegnata (campo nascosto): se nel browser nel frattempo è entrato
  // un altro account, non si scrive niente. L'utente vero resta quello del cookie.
  const dichiarato = Number(dati.get('utenteId'))
  const utente = await utenteDellaPagina(Number.isSafeInteger(dichiarato) ? dichiarato : null)
  if ('errore' in utente) return errore(utente.errore)
  const userId = utente.userId

  const azione = dati.get('azione')
  if (azione === 'conferma') return conferma(userId, dati)
  if (azione === 'annulla') return INDIRIZZO
  if (azione === 'invia') return invia(userId, dati)
  // Non esiste un'azione per togliere l'email: serve a recuperare la password, quindi si può solo sostituire.
  return errore('Azione non valida')
}

// Controlla la password della persona, contando il tentativo. Restituisce il problema, o null se è giusta.
async function controllaPassword(userId: number, dati: FormData): Promise<string | null> {
  const chiave = `utente-${userId}`
  const limite = limitePassword.controlla(chiave)
  if (!limite.consentito) return testoLimite(limite.riprovaTraSec)

  const password = dati.get('password')
  if (typeof password !== 'string' || password === '' || password.length > LUNGHEZZA_MAX_PASSWORD) {
    return 'Scrivi la tua password'
  }

  limitePassword.conta(chiave)
  const riga = await db.user.findUnique({ where: { id: userId }, select: { passwordHash: true } })
  if (!riga || !(await verificaPassword(password, riga.passwordHash))) {
    await pausa(PAUSA_DOPO_ERRORE_MS)
    return 'Password non corretta'
  }

  limitePassword.azzera(chiave)
  return null
}

async function invia(userId: number, dati: FormData): Promise<StatoEmail> {
  const segreto = valutaSegreto(process.env.AUTH_SECRET)
  if (!segreto.ok) {
    console.error(`[email] configurazione incompleta: ${segreto.problema}`)
    return errore('Non disponibile')
  }
  if (!emailAttiva()) return errore('L’invio delle email non è attivo su questo server')

  const scritto = dati.get('email')
  const email = typeof scritto === 'string' ? normalizzaEmail(scritto) : null
  if (email === null) return errore('Scrivi un indirizzo email valido, per esempio nome@icloud.com')

  const sbagliata = await controllaPassword(userId, dati)
  if (sbagliata) return errore(sbagliata)

  const attuale = await db.user.findUnique({ where: { id: userId }, select: { email: true } })
  if (attuale?.email === email) return errore('Questo indirizzo è già collegato al tuo account')

  const esito = await creaCodiceEmail(segreto.segreto, userId, 'email', email)
  if (!esito.ok) {
    if (esito.motivo === 'limite-globale') console.error('[email] limite giornaliero di email raggiunto')
    return errore(MESSAGGI_RIFIUTO[esito.motivo])
  }

  const messaggio = messaggioCodice(esito.codice, 'email')
  const invio = await inviaEmail({ a: email, ...messaggio })
  if (!invio.ok) {
    await annullaCodiceEmail(esito.id)
    console.error(`[email] messaggio non partito per l'utente ${userId}: ${invio.motivo}`)
    return errore('Non sono riuscito a mandare l’email. Controlla l’indirizzo e riprova tra poco')
  }

  return {
    passo: 'codice',
    errore: null,
    messaggio: 'Ti ho mandato un’email con il codice: vale 10 minuti. Se non la vedi, guarda anche nello spam.',
    email: mascheraEmail(email),
  }
}

async function conferma(userId: number, dati: FormData): Promise<StatoEmail> {
  const segreto = valutaSegreto(process.env.AUTH_SECRET)
  if (!segreto.ok) return errore('Non disponibile')

  // L'indirizzo mascherato torna dal modulo solo per essere mostrato di nuovo dopo un errore: non decide nulla.
  const mostrato = dati.get('mascherato')
  const mascherato = typeof mostrato === 'string' ? mostrato.slice(0, 60) : null

  const codice = dati.get('codice')
  if (typeof codice !== 'string' || codice.length > 40) return errore('Scrivi il codice che hai ricevuto', 'codice', mascherato)

  const esito = await controllaCodiceEmail(segreto.segreto, userId, 'email', codice)
  if (!esito.ok) {
    await pausa(PAUSA_DOPO_ERRORE_MS)
    return errore('Codice non corretto o scaduto', 'codice', mascherato)
  }

  // Un indirizzo nuovo rende inutili i codici di recupero mandati al vecchio.
  await db.$transaction([
    db.user.update({ where: { id: userId }, data: { email: esito.email } }),
    invalidaCodiciEmail(userId, 'recupero'),
  ])

  revalidatePath('/account')
  revalidatePath('/home')
  return { passo: 'indirizzo', errore: null, messaggio: 'Email collegata.', email: null }
}

// ---------- Eliminare l'account ----------
// Cancella l'account di chi è entrato, con tutto ciò che gli appartiene (scheda, esercizi, sedute, serie: quindi anche storico
// e progressi). Non si torna indietro. La conferma è una finestra di avviso nel browser (EliminaAccount.tsx), senza password:
// l'unico controllo del server è che l'account sia quello per cui la pagina è stata disegnata (utenteDellaPagina) e che la
// sessione sia valida. La cancellazione avviene in una transazione sola (lib/account-eliminazione.ts).
// Poi il cookie viene tolto. Gli altri dispositivi ancora connessi smettono di valere da soli: utenteCorrente (lib/accesso.ts)
// cerca la riga dell'utente e non la trova più. I backup già fatti non si toccano.
export type EsitoEliminazione = { ok: true } | { ok: false; errore: string }

export async function eliminaAccount(utenteId: unknown): Promise<EsitoEliminazione> {
  const utente = await utenteDellaPagina(utenteId)
  if ('errore' in utente) {
    // Sessione non più valida: o è scaduta, o l'account è già stato eliminato (da un altro dispositivo o da un'altra scheda).
    // Dal server non si distingue, quindi si dice la verità invece di far credere che riaccedere basti.
    if (utente.scaduta) {
      return {
        ok: false,
        errore: 'La sessione non è più valida. Se avevi già eliminato l’account non c’è altro da fare; altrimenti accedi di nuovo e riprova.',
      }
    }
    return { ok: false, errore: utente.errore }
  }
  const userId = utente.userId

  try {
    await db.$transaction((tx) => eliminaDatiUtente(tx, userId), { timeout: 30_000 })
  } catch (errore) {
    if (errore instanceof Error && errore.message === 'ACCOUNT_GIA_ELIMINATO') {
      ;(await cookies()).delete(COOKIE_SESSIONE)
      return { ok: true }
    }
    console.error(`[account] eliminazione non riuscita per l'utente ${userId}`, errore)
    return { ok: false, errore: 'Non sono riuscito a eliminare l’account: non è stato cancellato niente. Riprova.' }
  }

  ;(await cookies()).delete(COOKIE_SESSIONE)
  revalidatePath('/', 'layout')
  return { ok: true }
}
