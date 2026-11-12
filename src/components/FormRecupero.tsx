'use client'

import { useActionState } from 'react'
import { recuperaPassword, type StatoRecupero } from '@/app/login/actions'
import { CampoPassword } from './CampoPassword'
import { stileBottoneChiaro, stileBottonePrimario, stileTesto } from './stili'

const iniziale: StatoRecupero = { passo: 'utente', utente: '', errore: null, messaggio: null }

// Due passi nello stesso modulo: prima il nome utente (parte l'email), poi il codice con la password nuova.
export function FormRecupero() {
  const [stato, azione, inCorso] = useActionState(recuperaPassword, iniziale)

  return (
    // La chiave rimonta il modulo a ogni cambio di passo: i campi del passo nuovo partono puliti.
    <form key={stato.passo} action={azione} className="space-y-4">
      {stato.passo === 'utente' ? (
        <label className="block space-y-1 text-sm font-semibold text-muto">
          <span>Nome utente</span>
          <input
            name="utente"
            defaultValue={stato.utente}
            autoComplete="username"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            required
            maxLength={100}
            className={`${stileTesto} text-left`}
          />
        </label>
      ) : (
        <>
          <input type="hidden" name="utente" value={stato.utente} />
          <p className="text-sm text-muto">
            Account <span className="font-semibold text-testo">{stato.utente}</span>
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

          <CampoPassword
            etichetta="Nuova password"
            name="password"
            autoComplete="new-password"
            required
            minLength={8}
            maxLength={200}
            nota="Almeno 8 caratteri."
          />

          <CampoPassword etichetta="Ripeti la nuova password" name="conferma" autoComplete="new-password" required maxLength={200} />
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

      {/* Il primo pulsante è quello che parte con Invio. */}
      {stato.passo === 'utente' ? (
        <button type="submit" name="azione" value="invia" disabled={inCorso} className={stileBottonePrimario}>
          {inCorso ? 'Invio…' : 'Mandami il codice per email'}
        </button>
      ) : (
        <>
          <button type="submit" name="azione" value="reimposta" disabled={inCorso} className={stileBottonePrimario}>
            {inCorso ? 'Controllo…' : 'Cambia password'}
          </button>
          <button type="submit" name="azione" value="invia" formNoValidate disabled={inCorso} className={`${stileBottoneChiaro} w-full`}>
            Non è arrivato? Mandane un altro
          </button>
        </>
      )}
    </form>
  )
}
