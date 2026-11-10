'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { rimuoviGiornata } from '@/app/actions'
import { rimuoviGiornataAllievo } from '@/app/trainer/actions'
import { IconaCestino } from './icone'

// `sedute` è il numero di sedute registrate sulla giornata: la persona proprietaria della scheda lo vede nella conferma. Un
// personal trainer (`allievoId`) non lo deve sapere, quindi non lo riceve e la conferma non ne parla.
type Props = { utenteId: number; id: string; titolo: string; sedute?: number; allievoId?: number; base?: string }

// Toglie una giornata dalla scheda, dopo una conferma che dice cosa succede davvero: se ha sedute registrate non si
// cancellano, la giornata resta solo per lo storico.
export function RimuoviGiornata({ utenteId, id, titolo, sedute = 0, allievoId, base = '/scheda' }: Props) {
  const router = useRouter()
  const [errore, setErrore] = useState<string | null>(null)
  const [inCorso, startTransition] = useTransition()

  function rimuovi() {
    const domanda =
      allievoId !== undefined
        ? `Togliere la giornata ${id} (${titolo}) dalla scheda?\n\nSparisce con i suoi esercizi di scheda. Le sedute già registrate dall'utente restano nel suo storico.`
        : sedute > 0
          ? `Togliere la giornata ${id} (${titolo}) dalla scheda?\n\nHa ${sedute === 1 ? '1 seduta registrata' : `${sedute} sedute registrate`}: restano nello storico e nei progressi. Sparisce solo la giornata, con i suoi esercizi di scheda.`
          : `Togliere la giornata ${id} (${titolo}) dalla scheda?\n\nSparisce con i suoi esercizi di scheda. Non ha sedute registrate.`
    if (!window.confirm(domanda)) return

    setErrore(null)
    startTransition(async () => {
      const esito = allievoId === undefined ? await rimuoviGiornata(utenteId, id) : await rimuoviGiornataAllievo(utenteId, allievoId, id)
      if ('errore' in esito) return setErrore(esito.errore)
      router.push(base)
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
