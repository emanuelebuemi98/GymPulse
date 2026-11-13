'use server'

import { revalidatePath } from 'next/cache'
import { headers } from 'next/headers'
import { utenteDellaPagina } from '@/lib/accesso'
import {
  LUNGHEZZA_MAX_CODICE_TRAINER,
  codiceTrainerConfigurato,
  codiceTrainerGiusto,
  limiteCodiceTrainer,
} from '@/lib/codice-trainer'
import { db } from '@/lib/db'
import { indirizzoClient, testoLimite } from '@/lib/limite'
import { palestraDa } from '@/lib/palestre'
import { èViolazioneUnicita } from '@/lib/registrazione'
import { valutaSegreto } from '@/lib/sessione-auth'
import { MESSAGGIO_PALESTRA_OCCUPATA, palestraHaTrainer } from '@/lib/trainer-db'

export type EsitoTrainer = { ok: true; palestra: string } | { ok: false; errore: string }

const PAUSA_DOPO_ERRORE_MS = 800
const pausa = (ms: number) => new Promise((risolvi) => setTimeout(risolvi, ms))
const rifiuta = (errore: string): EsitoTrainer => ({ ok: false, errore })

// Fa passare l'account di chi è entrato da utente a personal trainer, con le stesse regole della registrazione come trainer: serve il
// codice d'invito (CODICE_TRAINER), serve la palestra, e ogni palestra ha un solo trainer. Il codice si confronta a tempo costante
// e gli errori si contano, per indirizzo e per persona, con lo stesso limite della registrazione (lib/codice-trainer.ts).
//
// Il ruolo si cambia con un updateMany che esige ancora «utente»: se nel frattempo l'account è già diventato trainer (da un'altra
// scheda o da terminale) non si tocca niente. La palestra scelta qui sostituisce quella di prima: da trainer non si cambia più
// dall'app (come alla registrazione), perché altrimenti un trainer potrebbe spostarsi nella palestra di chiunque per leggerne le
// schede. Tornare a utente non si può fare da qui: solo da terminale (NUOVO_RUOLO=utente, vedi prisma/utente.ts).
export async function diventaTrainer(utenteId: unknown, palestraScritta: unknown, codiceScritto: unknown): Promise<EsitoTrainer> {
  const segreto = valutaSegreto(process.env.AUTH_SECRET)
  if (!segreto.ok) {
    console.error(`[trainer] configurazione incompleta: ${segreto.problema}`)
    return rifiuta('Non disponibile')
  }

  // La pagina manda l'id dell'account per cui è stata disegnata: se nel browser è entrato un altro account, non si scrive niente.
  const utente = await utenteDellaPagina(utenteId)
  if ('errore' in utente) return rifiuta(utente.errore)
  const userId = utente.userId

  if (
    typeof palestraScritta !== 'string' ||
    typeof codiceScritto !== 'string' ||
    palestraScritta.length > 200 ||
    codiceScritto.length > LUNGHEZZA_MAX_CODICE_TRAINER
  ) {
    await pausa(PAUSA_DOPO_ERRORE_MS)
    return rifiuta('Compila tutti i campi')
  }

  const attuale = await db.user.findUnique({ where: { id: userId }, select: { ruolo: true } })
  if (!attuale) return rifiuta('Account non trovato')
  if (attuale.ruolo === 'trainer') return rifiuta('Questo account è già un personal trainer')

  // Un tentativo sbagliato conta per l'indirizzo (come alla registrazione) e per la persona (chi ha rubato una sessione non cambia
  // indirizzo per avere altri tentativi).
  const indirizzo = indirizzoClient(await headers())
  const chiavi = [indirizzo, `utente-${userId}`]
  for (const chiave of chiavi) {
    const limite = limiteCodiceTrainer.controlla(chiave)
    if (!limite.consentito) return rifiuta(testoLimite(limite.riprovaTraSec))
  }

  const palestra = palestraDa(palestraScritta)
  if (palestra === null) {
    await pausa(PAUSA_DOPO_ERRORE_MS)
    return rifiuta('Un personal trainer deve scegliere la sua palestra dall’elenco')
  }

  // Un solo messaggio per tutti i casi sbagliati (codice errato, opzione spenta): non fa capire se l'opzione esiste.
  if (!codiceTrainerConfigurato() || !codiceTrainerGiusto(codiceScritto, segreto.segreto)) {
    for (const chiave of chiavi) limiteCodiceTrainer.conta(chiave)
    await pausa(PAUSA_DOPO_ERRORE_MS)
    return rifiuta('Codice d’invito non valido')
  }

  // Si controlla DOPO il codice: chi non ce l'ha non deve poter usare il modulo per scoprire quali palestre sono occupate. Il
  // controllo vero sta nel database (indice unico parziale): questo dà subito un messaggio chiaro, e quello dopo l'update copre chi
  // arriva nello stesso istante.
  if (await palestraHaTrainer(palestra)) {
    await pausa(PAUSA_DOPO_ERRORE_MS)
    return rifiuta(MESSAGGIO_PALESTRA_OCCUPATA)
  }

  try {
    const { count } = await db.user.updateMany({ where: { id: userId, ruolo: 'utente' }, data: { ruolo: 'trainer', palestra } })
    if (count !== 1) return rifiuta('Questo account non può cambiare tipo da qui')
  } catch (errore) {
    if (èViolazioneUnicita(errore) && (await palestraHaTrainer(palestra))) return rifiuta(MESSAGGIO_PALESTRA_OCCUPATA)
    console.error(`[trainer] passaggio a trainer non riuscito per l'utente ${userId}`, errore)
    return rifiuta('Non sono riuscito a cambiare il tipo di account. Riprova.')
  }

  revalidatePath('/', 'layout')
  return { ok: true, palestra }
}
