'use client'

import { useActionState, useState } from 'react'
import { registrati, type StatoRegistrazione } from '@/app/login/actions'
import { PALESTRE } from '@/lib/palestre'
import { stileBottonePrimario, stileTesto } from './stili'

const iniziale: StatoRegistrazione = { errore: null, nome: '', utente: '', email: '', palestra: '', trainer: false }

// Un solo passo: nome, nome utente, email e password. Prima di tutto si sceglie se registrarsi come utente o come personal trainer.
// L'utente può indicare la palestra a cui appartiene (facoltativo). Il personal trainer deve scegliere la sua palestra e scrivere
// il codice d'invito che gli ha dato chi gestisce l'app; l'opzione compare solo se il server ha un codice configurato
// (`trainerAttivo`). L'account nasce subito, senza nessun codice da ricopiare per gli utenti.
export function FormRegistrazione({ trainerAttivo }: { trainerAttivo: boolean }) {
  const [stato, azione, inCorso] = useActionState(registrati, iniziale)
  const [trainer, setTrainer] = useState(stato.trainer)

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
        <span className="block text-xs font-normal">3-30 caratteri: lettere minuscole, numeri, punto, trattino o underscore.</span>
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
        <span className="block text-xs font-normal">Serve a recuperare la password: controlla di averla scritta giusta.</span>
      </label>

      {/* Prima scelta: chi sei. Due opzioni sempre visibili, non una casella nascosta in mezzo al modulo. L'opzione del
          personal trainer c'è solo se il server ha un codice d'invito configurato (`trainerAttivo`). */}
      <fieldset className="space-y-2">
        <legend className="mb-1 text-sm font-semibold text-muto">Tipo di account</legend>
        <div className={`grid gap-2 ${trainerAttivo ? 'grid-cols-2' : 'grid-cols-1'}`} role="radiogroup" aria-label="Tipo di account">
          {[
            { valore: false, titolo: 'Utente' },
            ...(trainerAttivo ? [{ valore: true, titolo: 'Personal Trainer' }] : []),
          ].map((opzione) => (
            <label
              key={opzione.titolo}
              className={`flex cursor-pointer items-center justify-center rounded-2xl border px-3 py-3 text-center transition active:opacity-80 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-accento ${trainer === opzione.valore ? 'border-accento bg-accento/10' : 'border-bordo bg-fondo'
                }`}
            >
              <input
                type="radio"
                name="ruolo"
                value={opzione.valore ? 'trainer' : 'utente'}
                checked={trainer === opzione.valore}
                onChange={() => setTrainer(opzione.valore)}
                className="sr-only"
              />
              <span className="font-extrabold text-testo">{opzione.titolo}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <label className="block space-y-1 text-sm font-semibold text-muto">
        <span>{trainer ? 'La tua palestra' : 'Palestra (facoltativa)'}</span>
        <select name="palestra" defaultValue={stato.palestra} required={trainer} className={`${stileTesto} text-left`}>
          <option value="">{trainer ? 'Scegli la tua palestra' : 'Nessuna palestra'}</option>
          {PALESTRE.map((palestra) => (
            <option key={palestra} value={palestra}>
              {palestra}
            </option>
          ))}
        </select>
        {/* Sceglierla è il consenso: questa frase deve restare. Il resto (cosa vedono e cosa no) sta nella pagina Account. */}
        {!trainer && (
          <span className="block text-xs font-normal">
            Il personal trainer della palestra potrà vedere e modificare la tua scheda (non i kg né lo storico). La togli da Account.
          </span>
        )}
      </label>

      {trainer && (
        <label className="block space-y-1 text-sm font-semibold text-muto">
          <span>Codice d&apos;invito</span>
          <input
            name="codice"
            type="password"
            autoComplete="off"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            required
            maxLength={200}
            className={`${stileTesto} text-left`}
          />
          <span className="block text-xs font-normal">Te lo dà chi gestisce l&apos;app.</span>
        </label>
      )}

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
