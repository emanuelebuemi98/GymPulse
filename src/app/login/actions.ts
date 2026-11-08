'use server'

import { cookies, headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { apriSessione } from '@/lib/accesso'
import {
  MESSAGGI_RIFIUTO,
  annullaCodiceEmail,
  annullaRegistrazioneSospesa,
  confermaRegistrazioneSospesa,
  controllaCodiceEmail,
  creaCodiceEmail,
  creaRegistrazioneSospesa,
  invalidaCodiciEmail,
  invalidaRegistrazioneSospesa,
  leggiRegistrazioneSospesa,
} from '@/lib/codici-email'
import { db } from '@/lib/db'
import { emailAttiva, inviaEmail } from '@/lib/email'
import { mascheraEmail, normalizzaEmail } from '@/lib/indirizzo-email'
import { creaLimite, indirizzoClient, testoLimite } from '@/lib/limite'
import { messaggioCodice, normalizzaCodiceOtp } from '@/lib/otp'
import { creaHashPassword, hashFittizio, verificaPassword } from '@/lib/password'
import {
  giornateVuote,
  normalizzaNomeCompleto,
  validaRegistrazione,
  èViolazioneUnicita,
} from '@/lib/registrazione'
import {
  COOKIE_SESSIONE,
  LUNGHEZZA_MAX_PASSWORD,
  normalizzaUsername,
  percorsoSicuro,
  validaNuovaPassword,
  valutaSegreto,
} from '@/lib/sessione-auth'

export type StatoLogin = { errore: string | null }

// Lo stato del recupero della password, in due passi: prima il nome utente (e parte l'email), poi codice e password nuova.
export type StatoRecupero = {
  passo: 'utente' | 'codice'
  utente: string
  errore: string | null
  messaggio: string | null
}

// Lo stato della registrazione, in due passi: i dati (e parte l'email), poi il codice. Dei campi scritti si rimandano
// indietro solo quelli che non sono segreti, così dopo un errore non si riscrive tutto: la password mai.
export type StatoRegistrazione = {
  passo: 'dati' | 'codice'
  errore: string | null
  messaggio: string | null
  registrazioneId: string | null
  emailMascherata: string | null
  nome: string
  utente: string
  email: string
}

const PAUSA_DOPO_ERRORE_MS = 800
const LUNGHEZZA_MAX_USERNAME = 100
const LUNGHEZZA_MAX_CAMPO = 200
const pausa = (ms: number) => new Promise((risolvi) => setTimeout(risolvi, ms))

// Limiti per indirizzo di rete. Gli account creati: 3 all'ora bastano a una persona vera e fermano chi li crea a raffica.
// Le email di registrazione e di recupero: un modulo respinto per un campo sbagliato non ne consuma. I limiti per
// casella e globali, che non si aggirano cambiando indirizzo di rete, stanno nel database (lib/codici-email.ts).
const limiteRegistrazioni = creaLimite(3, 60 * 60 * 1000)
const limiteInviiRegistrazione = creaLimite(5, 60 * 60 * 1000)
const limiteControlliRegistrazione = creaLimite(8, 15 * 60 * 1000)
const limiteAccessi = creaLimite(10, 15 * 60 * 1000)
const limiteInviiRecupero = creaLimite(5, 60 * 60 * 1000)
const limiteControlliRecupero = creaLimite(8, 15 * 60 * 1000)

export async function accedi(_precedente: StatoLogin, dati: FormData): Promise<StatoLogin> {
  const segreto = valutaSegreto(process.env.AUTH_SECRET)
  if (!segreto.ok) {
    // Il motivo resta nel log del server: chi sta fuori non deve sapere cosa manca.
    console.error(`[accesso] configurazione incompleta: ${segreto.problema}`)
    return { errore: 'Accesso non configurato' }
  }

  const indirizzo = indirizzoClient(await headers())
  const limite = limiteAccessi.prova(indirizzo)
  if (!limite.consentito) return { errore: testoLimite(limite.riprovaTraSec) }

  const utente = dati.get('utente')
  const password = dati.get('password')
  if (
    typeof utente !== 'string' ||
    typeof password !== 'string' ||
    utente.length > LUNGHEZZA_MAX_USERNAME ||
    password.length > LUNGHEZZA_MAX_PASSWORD
  ) {
    await pausa(PAUSA_DOPO_ERRORE_MS)
    return { errore: 'Nome utente o password non corretti' }
  }

  const riga = await db.user.findUnique({
    where: { username: normalizzaUsername(utente) },
    select: { id: true, passwordHash: true },
  })

  // Se l'utente non esiste si verifica comunque contro un hash finto: la risposta impiega lo stesso
  // tempo e non rivela quali nomi utente esistono.
  const passwordGiusta = await verificaPassword(password, riga?.passwordHash ?? (await hashFittizio()))

  if (!riga || !passwordGiusta) {
    // Una breve pausa rende lenti i tentativi a ripetizione.
    await pausa(PAUSA_DOPO_ERRORE_MS)
    return { errore: 'Nome utente o password non corretti' }
  }

  limiteAccessi.azzera(indirizzo)
  await apriSessione(segreto.segreto, riga.id, riga.passwordHash)
  redirect(percorsoSicuro(dati.get('da')))
}

// ---------- Registrazione ----------
// Tutti i campi sono obbligatori, email compresa, e l'account nasce solo quando l'indirizzo è confermato con un codice:
// così nessuno si registra con un indirizzo sbagliato o altrui, e ogni account può recuperare la password.
// Un solo modulo, tre azioni (campo "azione"):
//   invia      → controlla i dati e manda il codice (l'account NON esiste ancora);
//   rinvia     → rimanda un codice per la stessa registrazione;
//   conferma   → controlla il codice, crea l'account e fa entrare.

const registrazioneDaCapo = (
  errore: string | null,
  campi: Partial<Pick<StatoRegistrazione, 'nome' | 'utente' | 'email'>> = {},
): StatoRegistrazione => ({
  passo: 'dati',
  errore,
  messaggio: null,
  registrazioneId: null,
  emailMascherata: null,
  nome: campi.nome ?? '',
  utente: campi.utente ?? '',
  email: campi.email ?? '',
})

const registrazioneSulCodice = (
  registrazioneId: string,
  emailMascherata: string | null,
  esito: { errore?: string; messaggio?: string },
): StatoRegistrazione => ({
  passo: 'codice',
  errore: esito.errore ?? null,
  messaggio: esito.messaggio ?? null,
  registrazioneId,
  emailMascherata,
  nome: '',
  utente: '',
  email: '',
})

export async function registrati(_precedente: StatoRegistrazione, dati: FormData): Promise<StatoRegistrazione> {
  const azione = dati.get('azione')
  if (azione === 'conferma') return confermaRegistrazione(dati)
  if (azione === 'rinvia') return rinviaRegistrazione(dati)
  return richiediRegistrazione(dati)
}

async function richiediRegistrazione(dati: FormData): Promise<StatoRegistrazione> {
  const segreto = valutaSegreto(process.env.AUTH_SECRET)
  if (!segreto.ok) {
    console.error(`[registrazione] configurazione incompleta: ${segreto.problema}`)
    return registrazioneDaCapo('Registrazione non disponibile')
  }
  if (!emailAttiva()) return registrazioneDaCapo('La registrazione non è disponibile: l’invio delle email non è attivo su questo server')

  const indirizzo = indirizzoClient(await headers())
  for (const limite of [limiteRegistrazioni.controlla(indirizzo), limiteInviiRegistrazione.controlla(indirizzo)]) {
    if (!limite.consentito) return registrazioneDaCapo(testoLimite(limite.riprovaTraSec))
  }

  const nome = dati.get('nome')
  const utente = dati.get('utente')
  const emailScritta = dati.get('email')
  const password = dati.get('password')
  const conferma = dati.get('conferma')
  if (
    typeof nome !== 'string' ||
    typeof utente !== 'string' ||
    typeof emailScritta !== 'string' ||
    typeof password !== 'string' ||
    typeof conferma !== 'string' ||
    nome.length > LUNGHEZZA_MAX_CAMPO ||
    utente.length > LUNGHEZZA_MAX_CAMPO ||
    emailScritta.length > LUNGHEZZA_MAX_CAMPO ||
    password.length > LUNGHEZZA_MAX_PASSWORD ||
    conferma.length > LUNGHEZZA_MAX_PASSWORD
  ) {
    await pausa(PAUSA_DOPO_ERRORE_MS)
    return registrazioneDaCapo('Compila tutti i campi')
  }

  const fullName = normalizzaNomeCompleto(nome)
  const username = normalizzaUsername(utente)
  const campi = { nome: fullName, utente: username, email: emailScritta.trim().slice(0, 254) }

  const problema = validaRegistrazione(fullName, username, password, conferma)
  if (problema) {
    await pausa(PAUSA_DOPO_ERRORE_MS)
    return registrazioneDaCapo(problema, campi)
  }
  const email = normalizzaEmail(emailScritta)
  if (email === null) {
    await pausa(PAUSA_DOPO_ERRORE_MS)
    return registrazioneDaCapo('Scrivi un indirizzo email valido, per esempio nome@gmail.com', campi)
  }

  // Il nome utente libero si controlla subito, per non far aspettare un'email a chi ha scelto un nome già preso.
  if (await db.user.findUnique({ where: { username }, select: { id: true } })) {
    await pausa(PAUSA_DOPO_ERRORE_MS)
    return registrazioneDaCapo('Questo nome utente è già in uso', campi)
  }

  limiteInviiRegistrazione.conta(indirizzo)
  const sospesa = await creaRegistrazioneSospesa(segreto.segreto, {
    fullName,
    username,
    passwordHash: await creaHashPassword(password),
    email,
  })
  if (!sospesa.ok) {
    if (sospesa.motivo === 'limite-globale') console.error('[registrazione] limite giornaliero di email raggiunto')
    return registrazioneDaCapo(MESSAGGI_RIFIUTO[sospesa.motivo], campi)
  }

  const invio = await inviaEmail({ a: email, ...messaggioCodice(sospesa.codice, 'registrazione') })
  if (!invio.ok) {
    await annullaRegistrazioneSospesa(sospesa.id)
    console.error(`[registrazione] email non partita: ${invio.motivo}`)
    return registrazioneDaCapo('Non sono riuscito a mandare l’email. Controlla l’indirizzo e riprova tra poco.', campi)
  }

  return registrazioneSulCodice(sospesa.id, mascheraEmail(email), {
    messaggio: 'Ti ho mandato un’email con il codice: vale 10 minuti. Se non la vedi, guarda anche nello spam.',
  })
}

async function rinviaRegistrazione(dati: FormData): Promise<StatoRegistrazione> {
  const segreto = valutaSegreto(process.env.AUTH_SECRET)
  if (!segreto.ok) return registrazioneDaCapo('Registrazione non disponibile')
  if (!emailAttiva()) return registrazioneDaCapo('La registrazione non è disponibile: l’invio delle email non è attivo su questo server')

  const id = dati.get('registrazioneId')
  const mostrato = dati.get('mascherato')
  const mascherata = typeof mostrato === 'string' ? mostrato.slice(0, 60) : null

  const precedente = await leggiRegistrazioneSospesa(id)
  if (!precedente || typeof id !== 'string') {
    return registrazioneDaCapo('La registrazione è scaduta: compila di nuovo i dati.')
  }

  const indirizzo = indirizzoClient(await headers())
  const limite = limiteInviiRegistrazione.controlla(indirizzo)
  if (!limite.consentito) return registrazioneSulCodice(id, mascherata, { errore: testoLimite(limite.riprovaTraSec) })

  limiteInviiRegistrazione.conta(indirizzo)
  const nuova = await creaRegistrazioneSospesa(segreto.segreto, precedente)
  if (!nuova.ok) {
    if (nuova.motivo === 'limite-globale') console.error('[registrazione] limite giornaliero di email raggiunto')
    return registrazioneSulCodice(id, mascherata, { errore: MESSAGGI_RIFIUTO[nuova.motivo] })
  }

  const invio = await inviaEmail({ a: precedente.email, ...messaggioCodice(nuova.codice, 'registrazione') })
  if (!invio.ok) {
    await annullaRegistrazioneSospesa(nuova.id)
    console.error(`[registrazione] email non partita: ${invio.motivo}`)
    return registrazioneSulCodice(id, mascherata, { errore: 'Non sono riuscito a mandare l’email. Riprova tra poco.' })
  }

  // Il codice nuovo sostituisce quello di prima, che non deve più valere.
  await invalidaRegistrazioneSospesa(id)
  return registrazioneSulCodice(nuova.id, mascherata, { messaggio: 'Ti ho mandato un’altra email: vale 10 minuti.' })
}

async function confermaRegistrazione(dati: FormData): Promise<StatoRegistrazione> {
  const segreto = valutaSegreto(process.env.AUTH_SECRET)
  if (!segreto.ok) return registrazioneDaCapo('Registrazione non disponibile')

  const id = dati.get('registrazioneId')
  const codice = dati.get('codice')
  const mostrato = dati.get('mascherato')
  const mascherata = typeof mostrato === 'string' ? mostrato.slice(0, 60) : null
  if (typeof id !== 'string' || typeof codice !== 'string' || codice.length > LUNGHEZZA_MAX_USERNAME) {
    return registrazioneDaCapo('La registrazione è scaduta: compila di nuovo i dati.')
  }
  const sulCodice = (errore: string) => registrazioneSulCodice(id, mascherata, { errore })

  const indirizzo = indirizzoClient(await headers())
  const limite = limiteControlliRegistrazione.controlla(indirizzo)
  if (!limite.consentito) return sulCodice(testoLimite(limite.riprovaTraSec))
  if (normalizzaCodiceOtp(codice) === null) {
    await pausa(PAUSA_DOPO_ERRORE_MS)
    return sulCodice('Il codice ha 6 cifre')
  }

  limiteControlliRegistrazione.conta(indirizzo)
  const esito = await confermaRegistrazioneSospesa(segreto.segreto, id, codice)
  if (!esito.ok) {
    await pausa(PAUSA_DOPO_ERRORE_MS)
    return sulCodice('Codice non corretto o scaduto')
  }

  const { fullName, username, passwordHash, email } = esito.dati
  let userId: number
  try {
    const creato = await db.user.create({
      data: { fullName, username, passwordHash, email, giorni: { create: giornateVuote() } },
      select: { id: true },
    })
    userId = creato.id
  } catch (errore) {
    if (èViolazioneUnicita(errore)) {
      // Qualcuno ha confermato lo stesso nome utente mentre arrivava l'email.
      return registrazioneDaCapo('Questo nome utente è stato preso nel frattempo: scegline un altro.', {
        nome: fullName,
        email,
      })
    }
    console.error('[registrazione] errore imprevisto', errore)
    return registrazioneDaCapo('Non è stato possibile creare l’account. Riprova.')
  }

  limiteRegistrazioni.conta(indirizzo)
  await apriSessione(segreto.segreto, userId, passwordHash)
  redirect('/scheda/modifica?r=A')
}

// ---------- Recupero della password ----------
// Con un'email, in due passi dello stesso modulo (campo "azione"):
//   invia      → manda il codice all'email collegata all'account;
//   reimposta  → controlla il codice, cambia la password e fa entrare.
// Ogni account nuovo ha un'email confermata; quelli più vecchi la collegano dalla pagina Account.
export async function recuperaPassword(_precedente: StatoRecupero, dati: FormData): Promise<StatoRecupero> {
  return dati.get('azione') === 'reimposta' ? reimposta(dati) : richiediCodice(dati)
}

const daCapo = (errore: string, utente = ''): StatoRecupero => ({ passo: 'utente', utente, errore, messaggio: null })

async function richiediCodice(dati: FormData): Promise<StatoRecupero> {
  const segreto = valutaSegreto(process.env.AUTH_SECRET)
  if (!segreto.ok) {
    console.error(`[recupero] configurazione incompleta: ${segreto.problema}`)
    return daCapo('Recupero non disponibile')
  }
  if (!emailAttiva()) return daCapo('Il recupero con l’email non è attivo su questo server')

  const indirizzo = indirizzoClient(await headers())
  const limite = limiteInviiRecupero.controlla(indirizzo)
  if (!limite.consentito) return daCapo(testoLimite(limite.riprovaTraSec))

  const utente = dati.get('utente')
  if (typeof utente !== 'string' || utente.trim() === '' || utente.length > LUNGHEZZA_MAX_USERNAME) {
    await pausa(PAUSA_DOPO_ERRORE_MS)
    return daCapo('Scrivi il tuo nome utente')
  }
  const username = normalizzaUsername(utente)

  limiteInviiRecupero.conta(indirizzo)
  const riga = await db.user.findUnique({ where: { username }, select: { id: true, email: true } })

  // Un nome che non esiste e un account senza email ricevono la stessa risposta. Chi prova nomi a caso può però
  // capire quali account hanno un'email (la risposta è diversa): è una scelta, perché chi non ce l'ha deve sapere
  // subito che da qui non può recuperare nulla. Che un nome esista, del resto, lo dice già la registrazione
  // ("già in uso"). L'indirizzo non si mostra mai, e le email per persona, per casella e per indirizzo di rete sono limitate.
  if (!riga || !riga.email) {
    await pausa(PAUSA_DOPO_ERRORE_MS)
    return daCapo(
      'Non posso mandare un’email a questo nome utente: l’account non esiste oppure non ha un’email collegata.',
      username,
    )
  }

  const esito = await creaCodiceEmail(segreto.segreto, riga.id, 'recupero', riga.email)
  if (!esito.ok) {
    if (esito.motivo === 'troppo-presto') {
      return {
        passo: 'codice',
        utente: username,
        errore: null,
        messaggio: 'Ti ho appena mandato un codice: aspetta un minuto prima di chiederne un altro.',
      }
    }
    if (esito.motivo === 'limite-globale') console.error('[recupero] limite giornaliero di email raggiunto')
    return daCapo(MESSAGGI_RIFIUTO[esito.motivo], username)
  }

  const invio = await inviaEmail({ a: riga.email, ...messaggioCodice(esito.codice, 'recupero') })
  if (!invio.ok) {
    await annullaCodiceEmail(esito.id)
    console.error(`[recupero] email non partita per l'utente ${riga.id}: ${invio.motivo}`)
    return daCapo('Non sono riuscito a mandare l’email. Riprova tra poco.', username)
  }

  return {
    passo: 'codice',
    utente: username,
    errore: null,
    messaggio: 'Ti ho mandato un’email con il codice: vale 10 minuti. Se non la vedi, guarda anche nello spam.',
  }
}

async function reimposta(dati: FormData): Promise<StatoRecupero> {
  const segreto = valutaSegreto(process.env.AUTH_SECRET)
  if (!segreto.ok) {
    console.error(`[recupero] configurazione incompleta: ${segreto.problema}`)
    return daCapo('Recupero non disponibile')
  }

  const utente = dati.get('utente')
  const codice = dati.get('codice')
  const password = dati.get('password')
  const conferma = dati.get('conferma')
  if (
    typeof utente !== 'string' ||
    typeof codice !== 'string' ||
    typeof password !== 'string' ||
    typeof conferma !== 'string' ||
    utente.length > LUNGHEZZA_MAX_USERNAME ||
    codice.length > LUNGHEZZA_MAX_USERNAME ||
    password.length > LUNGHEZZA_MAX_PASSWORD ||
    conferma.length > LUNGHEZZA_MAX_PASSWORD
  ) {
    await pausa(PAUSA_DOPO_ERRORE_MS)
    return daCapo('Compila tutti i campi')
  }
  const username = normalizzaUsername(utente)
  const sulCodice = (errore: string): StatoRecupero => ({ passo: 'codice', utente: username, errore, messaggio: null })

  const indirizzo = indirizzoClient(await headers())
  const limite = limiteControlliRecupero.controlla(indirizzo)
  if (!limite.consentito) return sulCodice(testoLimite(limite.riprovaTraSec))

  // Gli errori di compilazione non consumano tentativi del codice: prima di controllarlo la password nuova deve andare bene.
  const problema = validaNuovaPassword(username, password) ?? (password !== conferma ? 'Le due password non coincidono' : null)
  if (problema) {
    await pausa(PAUSA_DOPO_ERRORE_MS)
    return sulCodice(problema)
  }
  if (normalizzaCodiceOtp(codice) === null) {
    await pausa(PAUSA_DOPO_ERRORE_MS)
    return sulCodice('Il codice ha 6 cifre')
  }

  limiteControlliRecupero.conta(indirizzo)
  const riga = await db.user.findUnique({ where: { username }, select: { id: true, email: true } })
  const esito = riga ? await controllaCodiceEmail(segreto.segreto, riga.id, 'recupero', codice) : null

  // Il codice vale solo se è stato mandato all'indirizzo che l'account ha adesso: se nel frattempo è cambiato,
  // chi ha in mano il vecchio indirizzo non può più usarlo.
  if (!riga || !esito?.ok || esito.email !== riga.email) {
    await pausa(PAUSA_DOPO_ERRORE_MS)
    return sulCodice('Codice non corretto o scaduto')
  }

  // Cambio della password e scadenza di ogni altro codice nella stessa transazione. Con la password nuova cambia
  // l'impronta scritta nei cookie, quindi ogni sessione aperta, su qualunque dispositivo, smette di valere.
  await db.$transaction([
    db.user.update({ where: { id: riga.id }, data: { passwordHash: await creaHashPassword(password) } }),
    invalidaCodiciEmail(riga.id),
  ])

  // Non si apre una sessione nuova: dopo un cambio di password si accede di nuovo con quella nuova. Il cookie rimasto
  // in questo browser non vale più, e lo si toglie per non lasciarlo in giro.
  ;(await cookies()).delete(COOKIE_SESSIONE)
  redirect('/login?r=1')
}

// Dopo l'uscita si torna alla presentazione dell'app (/), non al modulo di accesso.
export async function esci(): Promise<void> {
  const archivio = await cookies()
  archivio.delete(COOKIE_SESSIONE)
  redirect('/')
}
