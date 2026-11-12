'use client'

import { useState, useTransition } from 'react'
import { eliminaAccount } from '@/app/account/actions'
import { eliminaBozzeDi } from '@/lib/bozza'
import { eliminaBozzeSchedeDi } from '@/lib/bozza-scheda'
import { FinestraConferma } from './FinestraConferma'
import { IconaCestino, IconaScarica } from './icone'
import { stileBottoneChiaro } from './stili'

type Props = {
  utenteId: number
  // Cosa c'è oggi nell'account: serve a dire cosa sparisce davvero.
  dati: { giornate: number; esercizi: number; sedute: number; serie: number }
  èTrainer: boolean
}

const quanti = (n: number, uno: string, molti: string) => `${n} ${n === 1 ? uno : molti}`

// Elimina l'account per sempre. Un pannello che si apre con un tocco, il riepilogo di cosa sparisce, e una finestra di conferma
// con i colori dell'app (FinestraConferma, non quella del browser) prima di procedere: niente password. Dopo la cancellazione si tolgono dal browser anche le bozze delle sessioni in
// corso di questo account e si torna alla pagina iniziale con una navigazione completa (non router.push), così la cache
// di Next non conserva nulla della persona che non c'è più.
export function EliminaAccount({ utenteId, dati, èTrainer }: Props) {
  const [aperto, setAperto] = useState(false)
  const [conferma, setConferma] = useState(false)
  const [errore, setErrore] = useState<string | null>(null)
  const [inCorso, startTransition] = useTransition()

  function elimina() {
    setErrore(null)
    startTransition(async () => {
      const esito = await eliminaAccount(utenteId)
      if (!esito.ok) {
        // Non è stato cancellato niente: si chiude la finestra e l'errore si legge nel pannello.
        setConferma(false)
        return setErrore(esito.errore)
      }
      eliminaBozzeDi(utenteId)
      eliminaBozzeSchedeDi(utenteId)
      window.location.assign('/?account=eliminato')
    })
  }

  return (
    <section className="space-y-3 rounded-3xl border border-errore/40 bg-carta p-4">
      <h2 className="text-lg font-extrabold">Elimina account</h2>
      <p className="text-sm text-muto">
        Cancella per sempre il tuo account e tutti i suoi dati. Non si può annullare.
      </p>

      <button
        type="button"
        aria-expanded={aperto}
        onClick={() => setAperto((prec) => !prec)}
        className={`${stileBottoneChiaro} w-full !border-errore/40 !text-errore`}
      >
        <IconaCestino className="size-4" />
        {aperto ? 'Annulla' : 'Elimina il mio account'}
      </button>

      {aperto && (
        <div className="space-y-3 rounded-2xl bg-errore/10 p-3 text-sm">
          <p className="font-semibold text-testo">Cosa sparisce:</p>
          <ul className="list-disc space-y-1 pl-5 text-muto">
            <li>
              la scheda: {quanti(dati.giornate, 'giornata', 'giornate')} e {quanti(dati.esercizi, 'esercizio', 'esercizi')}
            </li>
            <li>
              lo storico: {quanti(dati.sedute, 'seduta', 'sedute')} e {quanti(dati.serie, 'serie', 'serie')}, con kg e ripetizioni
            </li>
            <li>i grafici e i progressi, che si calcolano da quei dati</li>
            <li>nome, nome utente, email e password: potrai registrare di nuovo lo stesso nome utente, ma come account nuovo e vuoto</li>
          </ul>
          {èTrainer && (
            <p className="text-muto">
              Le schede degli utenti che hai modificato <span className="font-semibold text-testo">restano</span> com&apos;erano: sono
              loro. Sparisce solo il tuo nome da «Modificata da».
            </p>
          )}
          <p className="text-muto">I backup già fatti non vengono toccati.</p>

          <a href="/api/scheda-csv?cosa=scheda" download className={`${stileBottoneChiaro} w-full`}>
            <IconaScarica className="size-4" />
            Scarica prima la tua scheda
          </a>

          {errore && (
            <p role="alert" className="font-semibold text-errore">
              {errore}
            </p>
          )}

          <button
            type="button"
            onClick={() => setConferma(true)}
            disabled={inCorso}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-errore px-5 py-3.5 text-base font-extrabold text-su-accento transition active:opacity-80 disabled:opacity-50"
          >
            <IconaCestino className="size-4" />
            Elimina definitivamente
          </button>
        </div>
      )}

      <FinestraConferma
        aperta={conferma}
        titolo="Vuoi eliminare definitivamente il tuo account?"
        testoConferma="Elimina"
        testoInCorso="Elimino…"
        pericolo
        inCorso={inCorso}
        alConferma={elimina}
        alAnnulla={() => setConferma(false)}
      />
    </section>
  )
}
