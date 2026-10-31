'use client'

import { useActionState } from 'react'
import { registrati, type StatoLogin } from '@/app/login/actions'
import { stileBottonePrimario, stileTesto } from './stili'

const iniziale: StatoLogin = { errore: null }

export function FormRegistrazione() {
  const [stato, azione, inCorso] = useActionState(registrati, iniziale)

  return (
    <form action={azione} className="space-y-4">
      <label className="block space-y-1 text-sm font-semibold text-muto">
        <span>Nome e cognome</span>
        <input
          name="nome"
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
        <span>Password</span>
        <input
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={10}
          maxLength={200}
          className={`${stileTesto} text-left`}
        />
        <span className="block text-xs font-normal">Almeno 10 caratteri.</span>
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

      {stato.errore && (
        <p role="alert" className="rounded-2xl bg-errore/10 p-3 text-sm font-semibold text-errore">
          {stato.errore}
        </p>
      )}

      <button type="submit" disabled={inCorso} className={stileBottonePrimario}>
        {inCorso ? 'Creo l’account…' : 'Crea account'}
      </button>
    </form>
  )
}
