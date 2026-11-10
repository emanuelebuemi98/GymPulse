'use server'

import { revalidatePath } from 'next/cache'
import { allievoDelTrainer, utenteDellaPagina } from '@/lib/accesso'
import { db } from '@/lib/db'
import { creaGiornata, salvaGiornata, togliGiornata } from '@/lib/scheda-scrittura'
import { validaScheda } from '@/lib/scheda-schema'

// Le azioni con cui un personal trainer cambia la scheda di un utente della sua palestra. Ogni azione è un indirizzo pubblico:
// il browser non è fidato. Il trainer è SEMPRE quello del cookie (utenteDellaPagina), l'allievo arriva dal browser ma conta solo
// se allievoDelTrainer dice di sì A QUESTA richiesta (stessa palestra, ruolo utente): se l'utente ha tolto la palestra nel
// frattempo, la richiesta è rifiutata. Dell'allievo non si legge né si restituisce altro che il nome completo.

const NON_AUTORIZZATO = 'Questa scheda non è più tra quelle che puoi modificare'

type Richiesta = { trainerId: number; allievoId: number }

async function autorizza(trainerAtteso: number, allievoId: unknown): Promise<Richiesta | { errore: string }> {
  const trainer = await utenteDellaPagina(trainerAtteso)
  if ('errore' in trainer) return { errore: trainer.errore }
  if (typeof allievoId !== 'number' || !Number.isInteger(allievoId)) return { errore: NON_AUTORIZZATO }
  if (!(await allievoDelTrainer(trainer.userId, allievoId))) return { errore: NON_AUTORIZZATO }
  return { trainerId: trainer.userId, allievoId }
}

function aggiornaPagine() {
  revalidatePath('/', 'layout')
}

export async function salvaSchedaAllievo(
  trainerAtteso: number,
  allievoId: unknown,
  input: unknown,
  versione: unknown = null,
): Promise<{ ok: true } | { errore: string }> {
  const ok = await autorizza(trainerAtteso, allievoId)
  if ('errore' in ok) return ok

  const esito = validaScheda(input)
  if (!esito.ok) return { errore: esito.errore }
  if (versione !== null && typeof versione !== 'string') return { errore: 'Dati non validi' }

  const salvata = await db.$transaction((tx) => salvaGiornata(tx, ok.allievoId, ok.trainerId, esito.dati, versione))
  if (!salvata.ok) return { errore: salvata.errore }

  aggiornaPagine()
  return { ok: true }
}

export async function aggiungiGiornataAllievo(
  trainerAtteso: number,
  allievoId: unknown,
): Promise<{ id: string } | { errore: string }> {
  const ok = await autorizza(trainerAtteso, allievoId)
  if ('errore' in ok) return ok

  const esito = await db.$transaction((tx) => creaGiornata(tx, ok.allievoId, ok.trainerId))
  if (!esito.ok) return { errore: esito.errore }

  aggiornaPagine()
  return { id: esito.id }
}

// Il trainer può togliere una giornata: se l'utente ha già fatto sedute su quella giornata restano nel suo storico e nei suoi
// progressi (la giornata viene archiviata, non cancellata). L'esito non dice se ce n'erano: sono dati che il trainer non vede.
export async function rimuoviGiornataAllievo(
  trainerAtteso: number,
  allievoId: unknown,
  id: unknown,
): Promise<{ ok: true } | { errore: string }> {
  const ok = await autorizza(trainerAtteso, allievoId)
  if ('errore' in ok) return ok
  if (typeof id !== 'string' || !/^[A-Z]$/.test(id)) return { errore: 'Giornata non valida' }

  try {
    const esito = await db.$transaction((tx) => togliGiornata(tx, ok.allievoId, id))
    if (!esito.ok) return { errore: esito.errore }
    aggiornaPagine()
    return { ok: true }
  } catch (errore) {
    console.error('[trainer] giornata non rimossa', errore)
    return { errore: 'Non sono riuscito a togliere la giornata: riprova' }
  }
}
