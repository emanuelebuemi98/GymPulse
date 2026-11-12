'use client'

import { useActionState } from 'react'
import { gestisciEmail, type StatoEmail } from '@/app/account/actions'
import { CampoPassword } from './CampoPassword'
import { stileBottoneChiaro, stileBottonePrimario, stileTesto } from './stili'

const iniziale: StatoEmail = { passo: 'indirizzo', errore: null, messaggio: null, email: null }

// Collega o cambia l'email per il recupero della password. Due passi: l'indirizzo con la password,
// poi il codice arrivato per email.
export function FormEmail({ haEmail, utenteId }: { haEmail: boolean; utenteId: number }) {
  const [stato, azione, inCorso] = useActionState(gestisciEmail, iniziale)

  return (
    <form key={stato.passo} action={azione} className="space-y-3">
      <input type="hidden" name="utenteId" value={utenteId} />
      {stato.passo === 'indirizzo' ? (
        <>
          <label className="block space-y-1 text-sm font-semibold text-muto">
            <span>{haEmail ? 'Nuovo indirizzo email' : 'La tua email'}</span>
            <input
              name="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              maxLength={254}
              placeholder="nome@esempio.it"
              className={`${stileTesto} text-left`}
            />
            <span className="block text-xs font-normal">Ti mando un codice per confermarlo.</span>
          </label>

          <CampoPassword
            etichetta="La tua password"
            name="password"
            autoComplete="current-password"
            maxLength={200}
            nota="La chiedo perché l'email permette di cambiare la password."
          />
        </>
      ) : (
        <>
          <input type="hidden" name="mascherato" value={stato.email ?? ''} />
          <p className="text-sm text-muto">
            Codice mandato a <span className="font-semibold text-testo">{stato.email}</span>
          </p>
          <label className="block space-y-1 text-sm font-semibold text-muto">
            <span>Codice ricevuto per email</span>
            <input
              name="codice"
              inputMode="numeric"
              autoComplete="one-time-code"
              required
              maxLength={12}
              placeholder="123456"
              className={`${stileTesto} text-left font-mono tracking-widest`}
            />
          </label>
        </>
      )}

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

      {stato.passo === 'indirizzo' ? (
        <button type="submit" name="azione" value="invia" disabled={inCorso} className={stileBottonePrimario}>
          {inCorso ? 'Invio…' : haEmail ? 'Mandami il codice per cambiarla' : 'Mandami il codice'}
        </button>
      ) : (
        <>
          <button type="submit" name="azione" value="conferma" disabled={inCorso} className={stileBottonePrimario}>
            {inCorso ? 'Controllo…' : 'Conferma l’email'}
          </button>
          <button type="submit" name="azione" value="annulla" formNoValidate disabled={inCorso} className={`${stileBottoneChiaro} w-full`}>
            Annulla
          </button>
        </>
      )}
    </form>
  )
}
