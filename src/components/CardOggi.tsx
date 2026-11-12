'use client'

import Link from 'next/link'
import { useState } from 'react'
import { IconaPlay } from './icone'
import { ImmagineEsercizio } from './ImmagineEsercizio'

export type GiornataCard = {
  id: string
  titolo: string
  esercizi: number
  // Le miniature da mostrare (già limitate dal server) e quante altre ce ne sono.
  anteprime: { id: number; immagine: string; nome: string }[]
  inPiu: number
}

type Props = {
  giornate: GiornataCard[]
  consigliata: string
  // Le giornate già fatte questa settimana (da lunedì).
  fatte: string[]
}

// La card «Oggi tocca a», con la giornata consigliata. Il pulsante «Cambia» apre l'elenco delle giornate: toccandone una la
// card si aggiorna subito, senza ricaricare la pagina. Serve a fare oggi la C invece della B, o a fare la B dopo.
export function CardOggi({ giornate, consigliata, fatte }: Props) {
  const [scelta, setScelta] = useState(consigliata)
  const [aperto, setAperto] = useState(false)

  const giornata = giornate.find((g) => g.id === scelta) ?? giornate[0]
  const èConsigliata = giornata.id === consigliata
  const giaFatte = new Set(fatte)

  return (
    <section className="relative overflow-hidden rounded-3xl bg-inchiostro p-6 text-su-inchiostro">
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -top-4 -right-2 text-[9rem] leading-none font-extrabold text-accento-chiaro/20"
      >
        {giornata.id}
      </span>

      {/* Il pulsante sta subito dopo il testo, a sinistra: a destra c'è la lettera grande della giornata. */}
      <div className="relative flex flex-wrap items-center gap-3">
        <p className="text-sm font-semibold text-su-inchiostro/70">{èConsigliata ? 'Oggi tocca a' : 'Hai scelto'}</p>
        {giornate.length > 1 && (
          <button
            type="button"
            onClick={() => setAperto((visibile) => !visibile)}
            aria-expanded={aperto}
            aria-controls="scelta-giornata"
            className="min-h-9 touch-manipulation rounded-full bg-su-inchiostro px-4 py-1.5 text-sm font-bold text-inchiostro transition active:opacity-80"
          >
            {aperto ? 'Chiudi' : 'Cambia'}
          </button>
        )}
      </div>

      {aperto && (
        <ul id="scelta-giornata" aria-label="Scegli la giornata" className="relative mt-3 space-y-1.5">
          {giornate.map((g) => {
            const scelta = g.id === giornata.id
            return (
              <li key={g.id}>
                <button
                  type="button"
                  onClick={() => {
                    setScelta(g.id)
                    setAperto(false)
                  }}
                  aria-pressed={scelta}
                  className={`flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition active:opacity-70 ${
                    scelta ? 'bg-accento-chiaro text-inchiostro' : 'bg-su-inchiostro/10 text-su-inchiostro'
                  }`}
                >
                  <span className="w-6 shrink-0 text-center text-lg font-extrabold">{g.id}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-bold">{g.titolo}</span>
                    <span className="block text-xs opacity-75">
                      {g.esercizi} esercizi
                      {g.id === consigliata && ' · consigliata'}
                      {giaFatte.has(g.id) && ' · fatta'}
                    </span>
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      )}

      <h1 className="relative mt-1 max-w-[16rem] text-3xl leading-tight font-extrabold tracking-tight">{giornata.titolo}</h1>
      <p className="relative mt-1 text-sm text-su-inchiostro/70">
        Allenamento {giornata.id} · {giornata.esercizi} esercizi
        {giaFatte.has(giornata.id) && ' · già fatta questa settimana'}
      </p>

      {/* Gli esercizi della giornata, in miniatura: si vede subito cosa c'è in programma. */}
      {giornata.anteprime.length > 0 && (
        <ul aria-label="Esercizi della giornata" className="relative mt-4 flex flex-wrap items-center gap-2">
          {giornata.anteprime.map((esercizio) => (
            <li key={esercizio.id}>
              <ImmagineEsercizio src={esercizio.immagine} nome={esercizio.nome} className="size-12 rounded-xl border-0" />
            </li>
          ))}
          {giornata.inPiu > 0 && <li className="text-sm font-bold text-su-inchiostro/80 tabular-nums">+{giornata.inPiu}</li>}
        </ul>
      )}

      <div className="relative mt-5 flex flex-wrap items-center gap-3">
        <Link
          href={`/sessione?r=${giornata.id}`}
          className="inline-flex items-center gap-2 rounded-full bg-accento-chiaro px-5 py-3 font-extrabold text-inchiostro active:opacity-80"
        >
          <IconaPlay className="size-4" />
          Inizia
        </Link>
        <Link
          href={`/scheda?r=${giornata.id}`}
          className="px-1 py-3 text-sm font-semibold text-su-inchiostro underline underline-offset-4"
        >
          Vedi la scheda
        </Link>
      </div>
    </section>
  )
}
