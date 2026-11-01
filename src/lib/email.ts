import nodemailer from 'nodemailer'
import { normalizzaEmail } from './indirizzo-email'

// Invio delle email. Il servizio si sceglie con le variabili d'ambiente; il resto dell'app chiama solo inviaEmail().
// Si parla con un server SMTP qualunque: il caso gratuito è un account Gmail (meglio uno creato apposta per l'app).
//
//   SMTP_UTENTE      l'indirizzo da cui partono i messaggi, per esempio gympulse.app@gmail.com
//   SMTP_PASSWORD    con Gmail: la "password per le app" di Google (16 lettere), NON la password dell'account
//   SMTP_HOST        facoltativa, di norma smtp.gmail.com
//   SMTP_PORTA       facoltativa, 587 (di norma) oppure 465
//
//   EMAIL_PROVIDER=console   non manda nulla: scrive il messaggio nel log del server. Solo per provare l'app, e non si
//                            accende su Vercel (che imposta VERCEL).
//
// Senza una configurazione valida i codici non partono e l'app lo dice (emailAttiva() è falso).

export type EsitoInvio = { ok: true } | { ok: false; motivo: string }

type ConfigurazioneSmtp = { tipo: 'smtp'; host: string; porta: number; utente: string; password: string }
export type ConfigurazioneEmail = { tipo: 'console' } | ConfigurazioneSmtp

type Ambiente = Record<string, string | undefined>
type Messaggio = { a: string; oggetto: string; testo: string }
type Trasporto = {
  sendMail(messaggio: { from: string; to: string; subject: string; text: string }): Promise<unknown>
}

const HOST_PREDEFINITO = 'smtp.gmail.com'
const PORTA_PREDEFINITA = 587
const FORMATO_HOST = /^[a-z0-9](?:[a-z0-9.-]{0,251}[a-z0-9])?$/
// Google mostra la password per le app a gruppi di quattro lettere separati da spazi; senza spazi è la stessa.
const PASSWORD_GOOGLE = /^[a-z]{4}(?: [a-z]{4}){3}$/
const TEMPO_MASSIMO_MS = 10_000

export function leggiConfigurazioneEmail(env: Ambiente = process.env): ConfigurazioneEmail | null {
  const servizio = env.EMAIL_PROVIDER?.trim().toLowerCase()
  if (servizio === 'console') return env.VERCEL ? null : { tipo: 'console' }
  if (servizio !== undefined && servizio !== '' && servizio !== 'smtp') return null

  const utente = normalizzaEmail(env.SMTP_UTENTE ?? '')
  const grezza = env.SMTP_PASSWORD?.trim()
  if (!utente || !grezza) return null
  const password = PASSWORD_GOOGLE.test(grezza) ? grezza.replaceAll(' ', '') : grezza

  const host = (env.SMTP_HOST?.trim() || HOST_PREDEFINITO).toLowerCase()
  if (!FORMATO_HOST.test(host)) return null
  const portaTesto = env.SMTP_PORTA?.trim()
  const porta = portaTesto ? Number(portaTesto) : PORTA_PREDEFINITA
  if (porta !== 587 && porta !== 465) return null

  return { tipo: 'smtp', host, porta, utente, password }
}

export function emailAttiva(env: Ambiente = process.env): boolean {
  return leggiConfigurazioneEmail(env) !== null
}

// Dal codice dell'errore di Nodemailer a una frase per il log del server. Non contiene mai né l'indirizzo né il codice
// segreto, e nemmeno il testo dell'errore, che potrebbe citare l'indirizzo.
function motivoDi(errore: unknown): string {
  const codice = typeof errore === 'object' && errore !== null && 'code' in errore ? errore.code : null
  switch (codice) {
    case 'EAUTH':
      return 'credenziali SMTP rifiutate (con Gmail serve la password per le app, con la verifica in due passaggi)'
    case 'EENVELOPE':
      return 'indirizzo rifiutato dal server'
    case 'ETIMEDOUT':
    case 'ECONNECTION':
    case 'ECONNREFUSED':
    case 'ESOCKET':
    case 'EDNS':
      return 'server SMTP non raggiungibile'
    default:
      return typeof codice === 'string' && /^[A-Z_]{3,30}$/.test(codice) ? `invio non riuscito (${codice})` : 'invio non riuscito'
  }
}

function trasportoSmtp(configurazione: ConfigurazioneSmtp): Trasporto {
  return nodemailer.createTransport({
    host: configurazione.host,
    port: configurazione.porta,
    // 465 parte già cifrata; 587 parte in chiaro e passa a TLS: requireTLS rifiuta di continuare se il server non lo offre.
    secure: configurazione.porta === 465,
    requireTLS: configurazione.porta !== 465,
    auth: { user: configurazione.utente, pass: configurazione.password },
    connectionTimeout: TEMPO_MASSIMO_MS,
    greetingTimeout: TEMPO_MASSIMO_MS,
    socketTimeout: TEMPO_MASSIMO_MS,
  })
}

// Manda un'email di solo testo. `creaTrasporto` serve solo a provare la funzione senza rete.
export async function inviaEmail(
  messaggio: Messaggio,
  configurazione: ConfigurazioneEmail | null = leggiConfigurazioneEmail(),
  creaTrasporto: (c: ConfigurazioneSmtp) => Trasporto = trasportoSmtp,
): Promise<EsitoInvio> {
  if (!configurazione) return { ok: false, motivo: 'servizio email non configurato' }
  // L'indirizzo finisce in un'intestazione del messaggio: se non ha esattamente la forma attesa non si spedisce.
  if (normalizzaEmail(messaggio.a) !== messaggio.a) return { ok: false, motivo: 'indirizzo non valido' }

  if (configurazione.tipo === 'console') {
    console.warn(`[email:console] a ${messaggio.a}\n${messaggio.testo}`)
    return { ok: true }
  }

  try {
    await creaTrasporto(configurazione).sendMail({
      from: `GymPulse <${configurazione.utente}>`,
      to: messaggio.a,
      subject: messaggio.oggetto,
      text: messaggio.testo,
    })
    return { ok: true }
  } catch (errore) {
    return { ok: false, motivo: motivoDi(errore) }
  }
}
