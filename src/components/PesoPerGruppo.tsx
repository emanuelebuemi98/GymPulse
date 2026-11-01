'use client'

import { useEffect, useRef, useState } from 'react'
import { formatNumero } from '@/lib/formato'
import type { PesoGruppo } from '@/lib/panoramica'

// I kg di una settimana per ogni gruppo muscolare. Sono poche parti da confrontare, quindi barre orizzontali di un
// solo colore: la lunghezza è il dato e il numero sta accanto. I gruppi restano nell'ordine standard e non in ordine di
// grandezza, così ognuno sta sempre allo stesso posto da una settimana all'altra.
//
// Il suggerimento con gli esercizi del gruppo compare col mouse sopra la riga, con la tastiera (Tab) e al tocco sul
// telefono, dove si apre e si chiude toccando la riga. Con il mouse il tocco non fa niente: ci pensa già il passaggio.
export function PesoPerGruppo({ gruppi }: { gruppi: PesoGruppo[] }) {
  const [aperto, setAperto] = useState<string | null>(null)
  const elenco = useRef<HTMLUListElement>(null)
  const puntatore = useRef('mouse')
  const massimo = Math.max(1, ...gruppi.map((voce) => voce.pesoKg))

  // Sul telefono nessun evento dice "il dito è andato via": si chiude toccando fuori dall'elenco.
  useEffect(() => {
    if (aperto === null) return
    const fuori = (evento: PointerEvent) => {
      if (!elenco.current?.contains(evento.target as Node)) setAperto(null)
    }
    document.addEventListener('pointerdown', fuori)
    return () => document.removeEventListener('pointerdown', fuori)
  }, [aperto])

  return (
    <ul ref={elenco} className="space-y-3">
      {gruppi.map(({ gruppo, pesoKg, esercizi }) => {
        const visibile = aperto === gruppo
        const idSuggerimento = `peso-${gruppo}`
        return (
          <li
            key={gruppo}
            className="relative"
            onPointerEnter={(e) => {
              puntatore.current = e.pointerType
              if (e.pointerType === 'mouse') setAperto(gruppo)
            }}
            onPointerLeave={(e) => {
              if (e.pointerType === 'mouse') setAperto((prec) => (prec === gruppo ? null : prec))
            }}
          >
            <button
              type="button"
              aria-expanded={visibile}
              aria-describedby={visibile ? idSuggerimento : undefined}
              onClick={() => {
                if (puntatore.current !== 'mouse') setAperto((prec) => (prec === gruppo ? null : gruppo))
              }}
              // Solo per chi usa la tastiera: un tocco o un clic mettono comunque il focus, ma non è questo il caso.
              onFocus={(e) => {
                if (e.currentTarget.matches(':focus-visible')) setAperto(gruppo)
              }}
              onBlur={() => setAperto((prec) => (prec === gruppo ? null : prec))}
              onKeyDown={(e) => {
                if (e.key === 'Escape') setAperto(null)
              }}
              className="block w-full rounded-lg text-left focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-grafico"
            >
              <span className="flex items-baseline justify-between gap-3">
                <span className="min-w-0 font-semibold">{gruppo}</span>
                <span className="shrink-0 text-sm font-extrabold tabular-nums text-testo">{formatNumero(pesoKg)} kg</span>
              </span>
              <span aria-hidden="true" className="mt-1.5 block">
                <span className="block h-3 rounded-r bg-grafico" style={{ width: `${(pesoKg / massimo) * 100}%` }} />
              </span>
            </button>

            {visibile && (
              <div
                id={idSuggerimento}
                role="tooltip"
                className="pointer-events-none absolute inset-x-0 top-full z-10 mt-1 space-y-2 rounded-2xl bg-inchiostro px-3 py-2.5 text-su-inchiostro shadow-lg"
              >
                {esercizi.length === 0 ? (
                  <p className="text-sm">Nessun esercizio di {gruppo.toLowerCase()} questa settimana.</p>
                ) : (
                  esercizi.map((esercizio) => (
                    <p key={esercizio.esercizioId}>
                      <span className="block font-bold">{esercizio.nome}</span>
                      <span className="block text-xs tabular-nums text-su-inchiostro/70">{esercizio.calcolo}</span>
                    </p>
                  ))
                )}
              </div>
            )}
          </li>
        )
      })}
    </ul>
  )
}
