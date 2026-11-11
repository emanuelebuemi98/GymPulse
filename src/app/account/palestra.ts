'use server'

import { revalidatePath } from 'next/cache'
import { utenteDellaPagina } from '@/lib/accesso'
import { db } from '@/lib/db'
import { palestraDa } from '@/lib/palestre'

// Lo stato del modulo della palestra nella pagina Account.
export type StatoPalestra = { errore: string | null; messaggio: string | null }

const errore = (testo: string): StatoPalestra => ({ errore: testo, messaggio: null })

// Sceglie o toglie la palestra di chi è entrato. Scegliere una palestra è il consenso: da quel momento il personal trainer di quella
// palestra può vedere e modificare la scheda (mai sedute, kg, grafici, email). Toglierla ritira il consenso subito: alla
// richiesta successiva il trainer non vede più la scheda. Solo gli utenti: un personal trainer ha la palestra scelta alla
// registrazione e non la cambia da qui (altrimenti potrebbe spostarsi nella palestra di chiunque per leggerne le schede).
export async function salvaPalestra(_precedente: StatoPalestra, dati: FormData): Promise<StatoPalestra> {
  // La pagina manda l'id dell'account per cui è stata disegnata: se nel browser è entrato un altro account, non si scrive niente.
  const dichiarato = Number(dati.get('utenteId'))
  const utente = await utenteDellaPagina(Number.isSafeInteger(dichiarato) ? dichiarato : null)
  if ('errore' in utente) return errore(utente.errore)

  const scritta = dati.get('palestra')
  if (typeof scritta !== 'string') return errore('Scelta non valida')
  const palestra = palestraDa(scritta)
  if (scritta.trim() !== '' && palestra === null) return errore('Scegli la palestra dall’elenco')

  // updateMany con la condizione sul ruolo: se nel frattempo l'account è diventato trainer (da terminale), non si tocca.
  const { count } = await db.user.updateMany({ where: { id: utente.userId, ruolo: 'utente' }, data: { palestra } })
  if (count !== 1) return errore('Questo account non può cambiare la palestra da qui')

  revalidatePath('/', 'layout')
  return {
    errore: null,
    messaggio: palestra
      ? `Palestra salvata: ${palestra}. Il personal trainer di questa palestra può ora vedere e modificare la tua scheda.`
      : 'Palestra tolta. Nessun personal trainer può più vedere la tua scheda.',
  }
}
