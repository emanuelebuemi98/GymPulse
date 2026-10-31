'use server'

import { cookies, headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { creaLimite, indirizzoClient } from '@/lib/limite'
import { creaHashPassword, hashFittizio, verificaPassword } from '@/lib/password'
import {
  giornateVuote,
  normalizzaNomeCompleto,
  validaRegistrazione,
  èViolazioneUnicita,
} from '@/lib/registrazione'
import {
  COOKIE_SESSIONE,
  DURATA_SESSIONE_SEC,
  LUNGHEZZA_MAX_PASSWORD,
  creaToken,
  normalizzaUsername,
  percorsoSicuro,
  valutaSegreto,
} from '@/lib/sessione-auth'

export type StatoLogin = { errore: string | null }

const PAUSA_DOPO_ERRORE_MS = 800
const LUNGHEZZA_MAX_USERNAME = 100
const LUNGHEZZA_MAX_CAMPO = 200
const pausa = (ms: number) => new Promise((risolvi) => setTimeout(risolvi, ms))

// Limiti per indirizzo. Per le registrazioni si contano solo gli account CREATI (3 all'ora bastano a una persona vera e
// fermano chi li crea a raffica): un modulo respinto per un campo sbagliato non consuma nulla, altrimenti chi sbaglia
// la password verrebbe bloccato. Per gli accessi si contano i tentativi, perché è lì che si indovinano le password.
const limiteRegistrazioni = creaLimite(3, 60 * 60 * 1000)
const limiteAccessi = creaLimite(10, 15 * 60 * 1000)

// Apre la sessione: cookie firmato con l'id numerico dell'utente. "secure" solo su https (Vercel manda
// x-forwarded-proto): su http locale il browser scarterebbe il cookie.
async function apriSessione(segreto: string, userId: number) {
  const archivio = await cookies()
  const èHttps = (await headers()).get('x-forwarded-proto') === 'https'
  archivio.set(COOKIE_SESSIONE, creaToken(segreto, userId), {
    httpOnly: true,
    sameSite: 'lax',
    secure: èHttps,
    path: '/',
    maxAge: DURATA_SESSIONE_SEC,
  })
}

const testoLimite = (secondi: number) =>
  `Troppi tentativi. Riprova tra ${secondi >= 120 ? `${Math.ceil(secondi / 60)} minuti` : `${secondi} secondi`}.`

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
  await apriSessione(segreto.segreto, riga.id)
  redirect(percorsoSicuro(dati.get('da')))
}

// Crea un nuovo account con le sue tre giornate vuote (A, B, C) e lo fa entrare. La registrazione è aperta a tutti.
export async function registrati(_precedente: StatoLogin, dati: FormData): Promise<StatoLogin> {
  const segreto = valutaSegreto(process.env.AUTH_SECRET)
  if (!segreto.ok) {
    console.error(`[registrazione] configurazione incompleta: ${segreto.problema}`)
    return { errore: 'Registrazione non disponibile' }
  }

  const indirizzo = indirizzoClient(await headers())
  const limite = limiteRegistrazioni.controlla(indirizzo)
  if (!limite.consentito) return { errore: testoLimite(limite.riprovaTraSec) }

  const nome = dati.get('nome')
  const utente = dati.get('utente')
  const password = dati.get('password')
  const conferma = dati.get('conferma')
  if (
    typeof nome !== 'string' ||
    typeof utente !== 'string' ||
    typeof password !== 'string' ||
    typeof conferma !== 'string' ||
    nome.length > LUNGHEZZA_MAX_CAMPO ||
    utente.length > LUNGHEZZA_MAX_CAMPO ||
    password.length > LUNGHEZZA_MAX_PASSWORD ||
    conferma.length > LUNGHEZZA_MAX_PASSWORD
  ) {
    await pausa(PAUSA_DOPO_ERRORE_MS)
    return { errore: 'Compila tutti i campi' }
  }

  const fullName = normalizzaNomeCompleto(nome)
  const username = normalizzaUsername(utente)
  const problema = validaRegistrazione(fullName, username, password, conferma)
  if (problema) {
    await pausa(PAUSA_DOPO_ERRORE_MS)
    return { errore: problema }
  }

  let userId: number
  try {
    const creato = await db.user.create({
      data: {
        fullName,
        username,
        passwordHash: await creaHashPassword(password),
        giorni: { create: giornateVuote() },
      },
      select: { id: true },
    })
    userId = creato.id
  } catch (errore) {
    if (èViolazioneUnicita(errore)) {
      await pausa(PAUSA_DOPO_ERRORE_MS)
      return { errore: 'Questo nome utente è già in uso' }
    }
    console.error('[registrazione] errore imprevisto', errore)
    return { errore: 'Non è stato possibile creare l’account. Riprova.' }
  }

  limiteRegistrazioni.conta(indirizzo)
  await apriSessione(segreto.segreto, userId)
  redirect('/scheda/modifica?r=A')
}

export async function esci(): Promise<void> {
  const archivio = await cookies()
  archivio.delete(COOKIE_SESSIONE)
  redirect('/login')
}
