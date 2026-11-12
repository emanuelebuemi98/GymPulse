'use client'

import { useActionState } from 'react'
import { accedi, type StatoLogin } from '@/app/login/actions'
import { CampoPassword } from './CampoPassword'
import { stileBottonePrimario, stileTesto } from './stili'

const iniziale: StatoLogin = { errore: null }

export function FormLogin({ da }: { da: string }) {
  const [stato, azione, inCorso] = useActionState(accedi, iniziale)

  return (
    <form action={azione} className="space-y-4">
      <input type="hidden" name="da" value={da} />

      <label className="block space-y-1 text-sm font-semibold text-muto">
        <span>Nome utente</span>
        <input
          name="utente"
          autoComplete="username"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          required
          maxLength={100}
          className={`${stileTesto} text-left`}
        />
      </label>

      <CampoPassword etichetta="Password" name="password" autoComplete="current-password" required maxLength={200} />

      {stato.errore && (
        <p role="alert" className="rounded-2xl bg-errore/10 p-3 text-sm font-semibold text-errore">
          {stato.errore}
        </p>
      )}

      <button type="submit" disabled={inCorso} className={stileBottonePrimario}>
        {inCorso ? 'Controllo…' : 'Accedi'}
      </button>
    </form>
  )
}
