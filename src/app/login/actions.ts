'use server'

import { cookies, headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { hashFittizio, creaHashPassword, verificaPassword } from '@/lib/password'
import {
  codiceInvitoCorretto,
  giornateVuote,
  valutaCodiceInvito,
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
import { creaIdUtente } from '@/lib/utente'

export type StatoLogin = { errore: string | null }

const PAUSA_DOPO_ERRORE_MS = 800
const LUNGHEZZA_MAX_USERNAME = 100
const pausa = (ms: number) => new Promise((risolvi) => setTimeout(risolvi, ms))

// Apre la sessione: cookie firmato con l'id dell'utente. "secure" solo su https (Vercel manda
// x-forwarded-proto): su http locale il browser scarterebbe il cookie.
async function apriSessione(segreto: string, userId: string) {
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

export async function accedi(_precedente: StatoLogin, dati: FormData): Promise<StatoLogin> {
  const segreto = valutaSegreto(process.env.AUTH_SECRET)
  if (!segreto.ok) {
    // Il motivo resta nel log del server: chi sta fuori non deve sapere cosa manca.
    console.error(`[accesso] configurazione incompleta: ${segreto.problema}`)
    return { errore: 'Accesso non configurato' }
  }

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
  const hash = riga?.passwordHash ?? (await hashFittizio())
  const passwordGiusta = await verificaPassword(password, hash)

  if (!riga?.passwordHash || !passwordGiusta) {
    // Una breve pausa rende lenti i tentativi a ripetizione.
    await pausa(PAUSA_DOPO_ERRORE_MS)
    return { errore: 'Nome utente o password non corretti' }
  }

  await apriSessione(segreto.segreto, riga.id)
  redirect(percorsoSicuro(dati.get('da')))
}

// Crea un nuovo account con le sue tre giornate vuote (A, B, C) e lo fa entrare. Serve il codice di invito.
export async function registrati(_precedente: StatoLogin, dati: FormData): Promise<StatoLogin> {
  const segreto = valutaSegreto(process.env.AUTH_SECRET)
  const invito = valutaCodiceInvito(process.env.CODICE_INVITO)
  if (!segreto.ok || !invito.ok) {
    console.error(`[registrazione] chiusa: ${!segreto.ok ? segreto.problema : 'CODICE_INVITO non impostato o troppo corto'}`)
    return { errore: 'Le registrazioni non sono aperte' }
  }

  const utente = dati.get('utente')
  const password = dati.get('password')
  const conferma = dati.get('conferma')
  const codice = dati.get('codice')
  if (typeof utente !== 'string' || typeof password !== 'string' || typeof conferma !== 'string') {
    return { errore: 'Compila tutti i campi' }
  }

  // Il codice si controlla per primo e con un messaggio generico: chi non lo ha non deve ricevere
  // altre informazioni (per esempio se un nome utente è già preso).
  if (!codiceInvitoCorretto(codice, invito.codice)) {
    await pausa(PAUSA_DOPO_ERRORE_MS)
    return { errore: 'Codice di invito non valido' }
  }

  const username = normalizzaUsername(utente)
  const problema = validaRegistrazione(username, password, conferma)
  if (problema) return { errore: problema }

  const userId = creaIdUtente()
  try {
    await db.user.create({
      data: {
        id: userId,
        name: username,
        username,
        passwordHash: await creaHashPassword(password),
        giorni: { create: giornateVuote() },
      },
    })
  } catch (errore) {
    if (èViolazioneUnicita(errore)) return { errore: 'Questo nome utente è già in uso' }
    console.error('[registrazione] errore imprevisto', errore)
    return { errore: 'Non è stato possibile creare l\'account. Riprova.' }
  }

  await apriSessione(segreto.segreto, userId)
  redirect('/scheda/modifica?r=A')
}

export async function esci(): Promise<void> {
  const archivio = await cookies()
  archivio.delete(COOKIE_SESSIONE)
  redirect('/login')
}
