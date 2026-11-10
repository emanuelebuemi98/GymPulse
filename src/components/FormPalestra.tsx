'use client'

import { useActionState } from 'react'
import { salvaPalestra, type StatoPalestra } from '@/app/account/palestra'
import { PALESTRE } from '@/lib/palestre'
import { stileBottonePrimario, stileTesto } from './stili'

const iniziale: StatoPalestra = { errore: null, messaggio: null }

// Il modulo con cui un utente sceglie (o toglie) la palestra. `attuale` è la palestra salvata, vuota se non ne ha.
export function FormPalestra({ attuale, utenteId }: { attuale: string; utenteId: number }) {
  const [stato, azione, inCorso] = useActionState(salvaPalestra, iniziale)

  return (
    <form action={azione} className="space-y-3">
      <input type="hidden" name="utenteId" value={utenteId} />
      <label className="block space-y-1 text-sm font-semibold text-muto">
        <span>{attuale ? 'Cambia palestra' : 'La tua palestra'}</span>
        <select name="palestra" defaultValue={attuale} className={`${stileTesto} text-left`}>
          <option value="">Nessuna palestra</option>
          {PALESTRE.map((palestra) => (
            <option key={palestra} value={palestra}>
              {palestra}
            </option>
          ))}
        </select>
      </label>

      {stato.messaggio && (
        <p role="status" className="rounded-2xl bg-ok/10 p-3 text-sm font-semibold text-ok">
          {stato.messaggio}
        </p>
      )}
      {stato.errore && (
        <p role="alert" className="rounded-2xl bg-errore/10 p-3 text-sm font-semibold text-errore">
          {stato.errore}
        </p>
      )}

      <button type="submit" disabled={inCorso} className={stileBottonePrimario}>
        {inCorso ? 'Salvo…' : attuale ? 'Salva la palestra' : 'Aggiungi la palestra'}
      </button>
    </form>
  )
}
