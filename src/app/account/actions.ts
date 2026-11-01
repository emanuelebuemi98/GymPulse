'use server'

import { revalidatePath } from 'next/cache'
import { utenteCorrente } from '@/lib/accesso'
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
import { LUNGHEZZA_MAX_PASSWORD, valutaSegreto } from '@/lib/sessione-auth'

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
  const userId = await utenteCorrente()
  if (!userId) return errore('Sessione scaduta: accedi di nuovo e riprova')

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
  if (email === null) return errore('Scrivi un indirizzo email valido, per esempio nome@gmail.com')

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
  revalidatePath('/')
  return { passo: 'indirizzo', errore: null, messaggio: 'Email collegata.', email: null }
}
