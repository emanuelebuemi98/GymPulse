'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { bozzeInCorso, contaSerieConfermate } from '@/lib/bozza'
import { IconaPlay } from './icone'

type Props = { utenteId: number; giorni: { id: string; titolo: string }[] }
type Ripresa = { giornoId: string; titolo: string; serie: number }

// Se a metà allenamento hai chiuso il browser, la bozza è ancora nel telefono: qui la si ritrova, qualunque sia la
// giornata che la home propone oggi. Si legge dopo il caricamento perché il server non vede il browser.
export function SessioneInCorso({ utenteId, giorni }: Props) {
  const [riprese, setRiprese] = useState<Ripresa[]>([])

  useEffect(() => {
    const titoli = new Map(giorni.map((giorno) => [giorno.id, giorno.titolo]))
    setRiprese(
      bozzeInCorso(utenteId).flatMap((bozza) => {
        const serie = contaSerieConfermate(bozza.dati)
        const titolo = titoli.get(bozza.giornoId)
        // Una giornata tolta dalla scheda non si può riprendere; una bozza senza serie confermate non serve.
        return serie > 0 && titolo !== undefined ? [{ giornoId: bozza.giornoId, titolo, serie }] : []
      }),
    )
  }, [utenteId, giorni])

  if (riprese.length === 0) return null

  return (
    <section aria-label="Sessione in corso" className="space-y-2">
      {riprese.map((ripresa) => (
        <Link
          key={ripresa.giornoId}
          href={`/sessione?r=${ripresa.giornoId}`}
          className="flex items-center gap-3 rounded-3xl border-2 border-accento bg-carta p-4 active:bg-carta-alta"
        >
          <span aria-hidden="true" className="grid size-10 shrink-0 place-items-center rounded-full bg-accento text-su-accento">
            <IconaPlay className="size-4" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block font-extrabold">Riprendi la sessione {ripresa.giornoId}</span>
            <span className="block truncate text-sm text-muto">
              {ripresa.titolo} · {ripresa.serie === 1 ? '1 serie confermata' : `${ripresa.serie} serie confermate`}
            </span>
          </span>
          <span aria-hidden="true" className="text-muto">
            ›
          </span>
        </Link>
      ))}
    </section>
  )
}
