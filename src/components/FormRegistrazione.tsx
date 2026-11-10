'use client'

import { useActionState } from 'react'
import { registrati, type StatoRegistrazione } from '@/app/login/actions'
import { stileBottonePrimario, stileTesto } from './stili'

const iniziale: StatoRegistrazione = { errore: null, nome: '', utente: '', email: '' }

// Un solo passo: nome, nome utente, email e password. L'account nasce subito, senza nessun codice da ricopiare.
export function FormRegistrazione() {
  const [stato, azione, inCorso] = useActionState(registrati, iniziale)

  return (
    // La chiave rimonta il modulo a ogni errore e ricompila i campi con quanto era stato scritto (la password no: va
    // riscritta).
    <form key={stato.errore ?? 'nuovo'} action={azione} className="space-y-4">
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
          placeholder="nome@esempio.it"
          className={`${stileTesto} text-left`}
        />
        <span className="block text-xs font-normal">
          Va bene qualsiasi email (Gmail, iCloud, Outlook…). Serve a recuperare la password se la dimentichi: controlla di averla scritta giusta. Puoi cambiarla dalla pagina Account.
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

      {stato.errore && (
        <p role="alert" className="rounded-2xl bg-errore/10 p-3 text-sm font-semibold text-errore">
          {stato.errore}
        </p>
      )}

      <button type="submit" disabled={inCorso} className={stileBottonePrimario}>
        {inCorso ? 'Creo l’account…' : 'Crea l’account'}
      </button>
    </form>
  )
}
