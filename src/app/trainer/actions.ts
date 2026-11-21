'use server'

import { revalidatePath } from 'next/cache'
import type { AnteprimaScheda } from '@/app/actions'
import { allievoDelTrainer, utenteDellaPagina } from '@/lib/accesso'
import { LIMITE_CSV } from '@/lib/csv'
import { db } from '@/lib/db'
import { pianoImportScheda, riepilogoPiano, scriviImportScheda, type EsitoImportScheda } from '@/lib/import-scheda'
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

// Il file CSV di una scheda (scaricato da un allievo, o scritto in Excel) caricato sulla scheda di un altro allievo. Stesse regole
// dell'importazione dell'utente (lib/import-scheda.ts): le giornate nel file si rifanno, le altre non cambiano, tutto o niente.
// Prima si fa vedere cosa cambia, poi si conferma. Il file contiene solo la scheda: kg e storico non ci sono, né qui né nel file.
export async function anteprimaImportSchedaAllievo(
  trainerAtteso: number,
  allievoId: unknown,
  testo: unknown,
): Promise<AnteprimaScheda | { errore: string }> {
  const ok = await autorizza(trainerAtteso, allievoId)
  if ('errore' in ok) return ok
  if (typeof testo !== 'string') return { errore: 'File non valido' }
  if (testo.length > LIMITE_CSV) return { errore: 'Il file è troppo grande per essere importato' }

  const piano = await pianoImportScheda(db, ok.allievoId, testo, true)
  if (!piano.ok) return { errore: piano.errore }
  return { giornate: riepilogoPiano(piano.giornate) }
}

export async function importaSchedaAllievo(
  trainerAtteso: number,
  allievoId: unknown,
  testo: unknown,
): Promise<EsitoImportScheda> {
  const ok = await autorizza(trainerAtteso, allievoId)
  if ('errore' in ok) return ok
  if (typeof testo !== 'string') return { errore: 'File non valido' }
  if (testo.length > LIMITE_CSV) return { errore: 'Il file è troppo grande per essere importato' }

  // La giornata risulta «Modificata da» il trainer (chi = trainerId), come per ogni altra modifica fatta da lui.
  const esito = await db.$transaction((tx) => scriviImportScheda(tx, ok.allievoId, ok.trainerId, testo, true), { timeout: 30_000 })

  if (!('errore' in esito)) aggiornaPagine()
  return esito
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
