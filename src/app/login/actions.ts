'use server'

import { cookies, headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { apriSessione } from '@/lib/accesso'
import {
  MESSAGGI_RIFIUTO,
  annullaCodiceEmail,
  controllaCodiceEmail,
  creaCodiceEmail,
  invalidaCodiciEmail,
} from '@/lib/codici-email'
import { db } from '@/lib/db'
import { emailAttiva, inviaEmail } from '@/lib/email'
import { codiceTrainerConfigurato, codiceTrainerGiusto } from '@/lib/codice-trainer'
import { validaEmail } from '@/lib/indirizzo-email'
import { creaLimite, indirizzoClient, testoLimite } from '@/lib/limite'
import { palestraDa } from '@/lib/palestre'
import { palestraHaTrainer } from '@/lib/trainer-db'
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

// Lo stato della registrazione, in un passo solo. Dei campi scritti si rimandano indietro solo quelli che non sono
// segreti, così dopo un errore non si riscrive tutto: la password mai.
export type StatoRegistrazione = {
  errore: string | null
  nome: string
  utente: string
  email: string
  // La palestra scelta (una di src/lib/palestre.ts, o il testo vuoto) e se si è spuntato «Sono un personal trainer». Il codice
  // d'invito non si rimanda mai indietro.
  palestra: string
  trainer: boolean
}

const MESSAGGIO_PALESTRA_OCCUPATA = 'Questa palestra ha già un personal trainer'
const PAUSA_DOPO_ERRORE_MS = 800
const LUNGHEZZA_MAX_USERNAME = 100
const LUNGHEZZA_MAX_CAMPO = 200
const pausa = (ms: number) => new Promise((risolvi) => setTimeout(risolvi, ms))

// Limiti per indirizzo di rete. Gli account creati: 3 all'ora bastano a una persona vera e fermano chi li crea a raffica.
// Le email di recupero: un modulo respinto per un campo sbagliato non ne consuma. I limiti per casella e globali, che non
// si aggirano cambiando indirizzo di rete, stanno nel database (lib/codici-email.ts).
const limiteRegistrazioni = creaLimite(3, 60 * 60 * 1000)
const limiteAccessi = creaLimite(10, 15 * 60 * 1000)
const limiteInviiRecupero = creaLimite(5, 60 * 60 * 1000)
const limiteControlliRecupero = creaLimite(8, 15 * 60 * 1000)
// I codici d'invito sbagliati: pochi, perché una persona vera lo scrive giusto al primo o al secondo colpo. Per istanza su Vercel,
// quindi rallenta e non blocca del tutto: la sicurezza vera è la lunghezza del codice (almeno 12 caratteri).
const limiteCodiceTrainer = creaLimite(5, 60 * 60 * 1000)

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
// Un solo passo: nome, nome utente, email (di qualunque fornitore) e password, e l'account nasce subito. L'email è obbligatoria ma alla
// registrazione NON si conferma con un codice: chi si iscrive non deve aspettare una posta e ricopiare un numero.
// Serve a recuperare la password. Si può cambiare quando si vuole dalla pagina Account, dove la nuova si conferma con un
// codice e serve la password.
// Il prezzo: nessuno prova che l'indirizzo sia davvero di chi lo scrive. Non lascia entrare nessuno nell'account
// (il codice di recupero arriva alla casella scritta, non a chi lo chiede), ma un indirizzo sbagliato rende la password
// non recuperabile, e uno altrui può ricevere codici che non ha chiesto (al massimo 3 all'ora, vedi lib/codici-email.ts).

const registrazioneRifiutata = (
  errore: string | null,
  campi: Partial<Pick<StatoRegistrazione, 'nome' | 'utente' | 'email' | 'palestra' | 'trainer'>> = {},
): StatoRegistrazione => ({
  errore,
  nome: campi.nome ?? '',
  utente: campi.utente ?? '',
  email: campi.email ?? '',
  palestra: campi.palestra ?? '',
  trainer: campi.trainer ?? false,
})

export async function registrati(_precedente: StatoRegistrazione, dati: FormData): Promise<StatoRegistrazione> {
  const segreto = valutaSegreto(process.env.AUTH_SECRET)
  if (!segreto.ok) {
    console.error(`[registrazione] configurazione incompleta: ${segreto.problema}`)
    return registrazioneRifiutata('Registrazione non disponibile')
  }

  const indirizzo = indirizzoClient(await headers())
  const limite = limiteRegistrazioni.controlla(indirizzo)
  if (!limite.consentito) return registrazioneRifiutata(testoLimite(limite.riprovaTraSec))

  const nome = dati.get('nome')
  const utente = dati.get('utente')
  const emailScritta = dati.get('email')
  const password = dati.get('password')
  const conferma = dati.get('conferma')
  const palestraScritta = dati.get('palestra') ?? ''
  const codiceScritto = dati.get('codice') ?? ''
  // La scelta «Utente» / «Personal trainer» del modulo. Qualunque altro valore vale utente: il ruolo di trainer si ottiene solo
  // dicendolo esplicitamente E con il codice d'invito giusto.
  const vuoleFareIlTrainer = dati.get('ruolo') === 'trainer'
  if (
    typeof nome !== 'string' ||
    typeof utente !== 'string' ||
    typeof emailScritta !== 'string' ||
    typeof password !== 'string' ||
    typeof conferma !== 'string' ||
    typeof palestraScritta !== 'string' ||
    typeof codiceScritto !== 'string' ||
    nome.length > LUNGHEZZA_MAX_CAMPO ||
    utente.length > LUNGHEZZA_MAX_CAMPO ||
    emailScritta.length > LUNGHEZZA_MAX_CAMPO ||
    palestraScritta.length > LUNGHEZZA_MAX_CAMPO ||
    codiceScritto.length > LUNGHEZZA_MAX_CAMPO ||
    password.length > LUNGHEZZA_MAX_PASSWORD ||
    conferma.length > LUNGHEZZA_MAX_PASSWORD
  ) {
    await pausa(PAUSA_DOPO_ERRORE_MS)
    return registrazioneRifiutata('Compila tutti i campi')
  }

  const fullName = normalizzaNomeCompleto(nome)
  const username = normalizzaUsername(utente)
  const palestra = palestraDa(palestraScritta)
  const campi = {
    nome: fullName,
    utente: username,
    email: emailScritta.trim().slice(0, 254),
    palestra: palestra ?? '',
    trainer: vuoleFareIlTrainer,
  }

  const problema = validaRegistrazione(fullName, username, password, conferma)
  if (problema) {
    await pausa(PAUSA_DOPO_ERRORE_MS)
    return registrazioneRifiutata(problema, campi)
  }
  const emailValida = validaEmail(emailScritta)
  if (!emailValida.ok) {
    await pausa(PAUSA_DOPO_ERRORE_MS)
    return registrazioneRifiutata(emailValida.errore, campi)
  }

  // La palestra è facoltativa, ma se c'è deve essere una di quelle dell'elenco: sceglierla è anche il consenso a far vedere la
  // scheda ai trainer di quella palestra, quindi un testo libero non è ammesso.
  if (palestraScritta.trim() !== '' && palestra === null) {
    await pausa(PAUSA_DOPO_ERRORE_MS)
    return registrazioneRifiutata('Scegli la palestra dall’elenco', campi)
  }

  // Chi vuole fare il trainer ha bisogno del codice d'invito e della palestra. Il codice si controlla prima di calcolare l'hash
  // della password e di creare l'account; ogni errore si conta, e un messaggio solo per tutti i casi sbagliati (codice, opzione
  // spenta) non fa capire se l'opzione esiste.
  if (vuoleFareIlTrainer) {
    const limiteCodice = limiteCodiceTrainer.controlla(indirizzo)
    if (!limiteCodice.consentito) return registrazioneRifiutata(testoLimite(limiteCodice.riprovaTraSec), campi)
    if (palestra === null) {
      await pausa(PAUSA_DOPO_ERRORE_MS)
      return registrazioneRifiutata('Un personal trainer deve scegliere la sua palestra', campi)
    }
    if (!codiceTrainerConfigurato() || !codiceTrainerGiusto(codiceScritto, segreto.segreto)) {
      limiteCodiceTrainer.conta(indirizzo)
      await pausa(PAUSA_DOPO_ERRORE_MS)
      return registrazioneRifiutata('Codice d’invito non valido', campi)
    }
    // Un solo trainer per palestra. Si controlla DOPO il codice: chi non ha il codice non deve poter usare il modulo per scoprire
    // quali palestre sono occupate. Il controllo vero sta nel database (indice unico parziale): questo serve a dare subito un
    // messaggio chiaro senza calcolare l'hash, e quello dopo la creazione copre chi arriva nello stesso istante.
    if (await palestraHaTrainer(palestra)) {
      await pausa(PAUSA_DOPO_ERRORE_MS)
      return registrazioneRifiutata(MESSAGGIO_PALESTRA_OCCUPATA, campi)
    }
  }

  // Il nome utente libero si controlla prima di calcolare l'hash della password, che costa tempo.
  if (await db.user.findUnique({ where: { username }, select: { id: true } })) {
    await pausa(PAUSA_DOPO_ERRORE_MS)
    return registrazioneRifiutata('Questo nome utente è già in uso', campi)
  }

  const passwordHash = await creaHashPassword(password)
  let userId: number
  try {
    const creato = await db.user.create({
      data: {
        fullName,
        username,
        passwordHash,
        email: emailValida.email,
        palestra,
        ruolo: vuoleFareIlTrainer ? 'trainer' : 'utente',
        giorni: { create: giornateVuote() },
      },
      select: { id: true },
    })
    userId = creato.id
  } catch (errore) {
    if (èViolazioneUnicita(errore)) {
      // Due vincoli diversi rispondono con lo stesso codice (P2002): il nome utente e la palestra del trainer. Non si indovina dal
      // messaggio: si guarda nel database cosa è successo. Se il nome utente c'è, è quello; altrimenti, per un trainer, la
      // palestra è stata presa da qualcuno arrivato un attimo prima.
      if (await db.user.findUnique({ where: { username }, select: { id: true } })) {
        return registrazioneRifiutata('Questo nome utente è già in uso', campi)
      }
      if (vuoleFareIlTrainer && palestra !== null && (await palestraHaTrainer(palestra))) {
        return registrazioneRifiutata(MESSAGGIO_PALESTRA_OCCUPATA, campi)
      }
      console.error('[registrazione] violazione di unicità non riconosciuta', errore)
      return registrazioneRifiutata('Non è stato possibile creare l’account. Riprova.', campi)
    }
    console.error('[registrazione] errore imprevisto', errore)
    return registrazioneRifiutata('Non è stato possibile creare l’account. Riprova.', campi)
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
