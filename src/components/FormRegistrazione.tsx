'use client'

import { useActionState } from 'react'
import { registrati, type StatoRegistrazione } from '@/app/login/actions'
import { stileBottoneChiaro, stileBottonePrimario, stileTesto } from './stili'

const iniziale: StatoRegistrazione = {
  passo: 'dati',
  errore: null,
  messaggio: null,
  registrazioneId: null,
  emailMascherata: null,
  nome: '',
  utente: '',
  email: '',
}

// Due passi nello stesso modulo: prima tutti i dati (email compresa), poi il codice arrivato per email.
// L'account si crea solo al secondo passo, quando l'indirizzo è confermato.
export function FormRegistrazione() {
  const [stato, azione, inCorso] = useActionState(registrati, iniziale)

  return (
    // La chiave rimonta il modulo a ogni cambio di passo, e ricompila i campi con quanto era stato scritto
    // (la password no: va riscritta).
    <form key={`${stato.passo}-${stato.errore ?? ''}`} action={azione} className="space-y-4">
      {stato.passo === 'dati' ? (
        <>
          <label className="block space-y-1 text-sm font-semibold text-muto">
            <span>Nome e cognome</span>
            <input
              name="nome"
              defaultValue={stato.nome}
              autoComplete="name"
              autoCapitalize="words"
              required
              minLength={2}
              maxLength={80}
              className={`${stileTesto} text-left`}
            />
          </label>

          <label className="block space-y-1 text-sm font-semibold text-muto">
            <span>Scegli un nome utente</span>
            <input
              name="utente"
              defaultValue={stato.utente}
              autoComplete="username"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              required
              minLength={3}
              maxLength={30}
              className={`${stileTesto} text-left`}
            />
            <span className="block text-xs font-normal">Da 3 a 30 caratteri: lettere minuscole, numeri, punto, trattino o underscore.</span>
          </label>

          <label className="block space-y-1 text-sm font-semibold text-muto">
            <span>Email</span>
            <input
              name="email"
              defaultValue={stato.email}
              type="email"
              inputMode="email"
              autoComplete="email"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              required
              maxLength={254}
              placeholder="nome@gmail.com"
              className={`${stileTesto} text-left`}
            />
            <span className="block text-xs font-normal">
              Ti mando un codice per confermarla: serve a recuperare la password se la dimentichi.
            </span>
          </label>

          <label className="block space-y-1 text-sm font-semibold text-muto">
            <span>Password</span>
            <input
              name="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              maxLength={200}
              className={`${stileTesto} text-left`}
            />
            <span className="block text-xs font-normal">Almeno 8 caratteri.</span>
          </label>

          <label className="block space-y-1 text-sm font-semibold text-muto">
            <span>Ripeti la password</span>
            <input
              name="conferma"
              type="password"
              autoComplete="new-password"
              required
              maxLength={200}
              className={`${stileTesto} text-left`}
            />
          </label>
        </>
      ) : (
        <>
          <input type="hidden" name="registrazioneId" value={stato.registrazioneId ?? ''} />
          <input type="hidden" name="mascherato" value={stato.emailMascherata ?? ''} />
          <p className="text-sm text-muto">
            Codice mandato a <span className="font-semibold text-testo">{stato.emailMascherata}</span>
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

      {/* Il primo pulsante è quello che parte con Invio. */}
      {stato.passo === 'dati' ? (
        <button type="submit" name="azione" value="invia" disabled={inCorso} className={stileBottonePrimario}>
          {inCorso ? 'Invio…' : 'Mandami il codice per email'}
        </button>
      ) : (
        <>
          <button type="submit" name="azione" value="conferma" disabled={inCorso} className={stileBottonePrimario}>
            {inCorso ? 'Creo l’account…' : 'Conferma e crea l’account'}
          </button>
          <button type="submit" name="azione" value="rinvia" formNoValidate disabled={inCorso} className={`${stileBottoneChiaro} w-full`}>
            Non è arrivato? Mandane un altro
          </button>
        </>
      )}
    </form>
  )
}
