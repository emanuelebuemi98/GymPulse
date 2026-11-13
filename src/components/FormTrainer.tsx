'use client'

import { useId, useState, useTransition, type FormEvent } from 'react'
import { diventaTrainer } from '@/app/account/trainer'
import { PALESTRE } from '@/lib/palestre'
import { CampoPassword } from './CampoPassword'
import { FinestraConferma } from './FinestraConferma'
import { stileBottoneChiaro, stileBottonePrimario, stileTesto } from './stili'

// Il passaggio da utente a personal trainer, dalla pagina Account. Un pannello che si apre con un tocco (a quasi tutti non serve),
// palestra e codice d'invito, e una finestra di conferma con le conseguenze prima di cambiare davvero: da trainer la palestra non si
// cambia più dall'app e tornare a utente non si può fare da qui. Dopo il passaggio si ricarica la pagina con una navigazione completa,
// così tutto (menu, riquadri, «I tuoi allievi») si ridisegna per il ruolo nuovo.
export function FormTrainer({ utenteId }: { utenteId: number }) {
  const idPannello = useId()
  const [aperto, setAperto] = useState(false)
  const [palestra, setPalestra] = useState('')
  const [codice, setCodice] = useState('')
  const [errore, setErrore] = useState<string | null>(null)
  const [conferma, setConferma] = useState(false)
  const [fatto, setFatto] = useState(false)
  const [inCorso, startTransition] = useTransition()

  function chiedi(evento: FormEvent) {
    evento.preventDefault()
    setErrore(null)
    if (palestra === '') return setErrore('Scegli la tua palestra')
    if (codice.trim() === '') return setErrore('Scrivi il codice d’invito')
    setConferma(true)
  }

  function cambia() {
    setErrore(null)
    startTransition(async () => {
      const esito = await diventaTrainer(utenteId, palestra, codice)
      if (!esito.ok) {
        // Non è cambiato niente: si chiude la finestra e l'errore si legge sotto il modulo.
        setConferma(false)
        return setErrore(esito.errore)
      }
      setFatto(true)
      window.location.assign('/account?ruolo=trainer')
    })
  }

  return (
    <div className="space-y-3">
      <button
        type="button"
        aria-expanded={aperto}
        aria-controls={idPannello}
        onClick={() => setAperto((prec) => !prec)}
        className={`${stileBottoneChiaro} w-full`}
      >
        {aperto ? 'Annulla' : 'Passa a personal trainer'}
      </button>

      {aperto && (
        <form id={idPannello} onSubmit={chiedi} className="space-y-3 rounded-2xl bg-carta-alta p-3">
          <label className="block space-y-1 text-sm font-semibold text-muto">
            <span>La tua palestra</span>
            <select
              name="palestra"
              value={palestra}
              onChange={(e) => setPalestra(e.target.value)}
              className={`${stileTesto} text-left`}
            >
              <option value="">Scegli la tua palestra</option>
              {PALESTRE.map((nome) => (
                <option key={nome} value={nome}>
                  {nome}
                </option>
              ))}
            </select>
          </label>

          <CampoPassword
            etichetta="Codice d'invito"
            name="codice"
            value={codice}
            onChange={(e) => setCodice(e.target.value)}
            autoComplete="off"
            maxLength={200}
            nota="Te lo dà chi gestisce l'app."
          />

          {errore && (
            <p role="alert" className="rounded-2xl bg-errore/10 p-3 text-sm font-semibold text-errore">
              {errore}
            </p>
          )}

          <button type="submit" disabled={inCorso || fatto} className={stileBottonePrimario}>
            Continua
          </button>
        </form>
      )}

      <FinestraConferma
        aperta={conferma}
        titolo={`Vuoi diventare personal trainer di ${palestra}?`}
        testoConferma="Sì, passa a trainer"
        testoInCorso="Cambio…"
        inCorso={inCorso || fatto}
        alConferma={cambia}
        alAnnulla={() => setConferma(false)}
      >
        <p>Da quel momento:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            vedi il nome e la scheda degli utenti che hanno scelto questa palestra, e puoi modificarla; non vedi i loro kg, lo storico,
            i grafici né l&apos;email;
          </li>
          <li>la tua scheda e il tuo storico restano tuoi, come ora;</li>
          <li>la palestra non si cambia più dall&apos;app, e se prima ne avevi scelta un&apos;altra, il suo trainer non vede più la tua scheda;</li>
          <li>tornare a utente non si può fare da qui.</li>
        </ul>
      </FinestraConferma>
    </div>
  )
}
