'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { rimuoviGiornata } from '@/app/actions'
import { IconaCestino } from './icone'

type Props = { id: string; titolo: string; sedute: number }

// Toglie una giornata dalla scheda, dopo una conferma che dice cosa succede davvero: se ha sedute registrate non si
// cancellano, la giornata resta solo per lo storico.
export function RimuoviGiornata({ id, titolo, sedute }: Props) {
  const router = useRouter()
  const [errore, setErrore] = useState<string | null>(null)
  const [inCorso, startTransition] = useTransition()

  function rimuovi() {
    const domanda =
      sedute > 0
        ? `Togliere la giornata ${id} (${titolo}) dalla scheda?\n\nHa ${sedute === 1 ? '1 seduta registrata' : `${sedute} sedute registrate`}: restano nello storico e nei progressi. Sparisce solo la giornata, con i suoi esercizi di scheda.`
        : `Togliere la giornata ${id} (${titolo}) dalla scheda?\n\nSparisce con i suoi esercizi di scheda. Non ha sedute registrate.`
    if (!window.confirm(domanda)) return

    setErrore(null)
    startTransition(async () => {
      const esito = await rimuoviGiornata(id)
      if ('errore' in esito) return setErrore(esito.errore)
      router.push('/scheda')
      router.refresh()
    })
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={rimuovi}
        disabled={inCorso}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-errore/10 px-4 py-3 text-sm font-semibold text-errore disabled:opacity-50"
      >
        <IconaCestino className="size-4" />
        {inCorso ? 'Tolgo…' : `Togli la giornata ${id} dalla scheda`}
      </button>
      {errore && (
        <p role="alert" className="text-sm text-errore">
          {errore}
        </p>
      )}
    </div>
  )
}
