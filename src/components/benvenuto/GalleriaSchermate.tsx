'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'
import { IconaChiudi, IconaDestra, IconaLente, IconaSinistra } from '../icone'
import { stileBottoneChiaro } from '../stili'

export type VoceGalleria = { titolo: string; testo: string; schermata: ReactNode }

// Misure del telefono disegnato in Index.tsx, in punti: la cornice è larga 240 e alta 352 più 16 di bordo.
const LARGHEZZA_TELEFONO = 240
const ALTEZZA_TELEFONO = 368
// Quello che sta nella finestra oltre al telefono: riga in alto, titolo, testo, pulsanti e margini.
const ALTEZZA_RESTO = 250
const SCALA_MIN = 0.6
const SCALA_MAX = 1.5
const LARGHEZZA_FINESTRA_MAX = 448
// Quanto deve spostarsi il dito, in punti, perché conti come "scorri alla scheda dopo".
const SOGLIA_SCORRIMENTO = 50

// Quanto ingrandire il telefono perché stia nella finestra, a qualunque schermo: più largo che si può, ma senza uscire
// dallo schermo né in larghezza né in altezza. Sopra 1,5 le scritte da 11 punti diventerebbero sgranate.
function scalaPerLoSchermo(): number {
  const finestra = Math.min(window.innerWidth - 32, LARGHEZZA_FINESTRA_MAX)
  const perLarghezza = (finestra - 32) / LARGHEZZA_TELEFONO
  const perAltezza = (window.innerHeight - 32 - ALTEZZA_RESTO) / ALTEZZA_TELEFONO
  return Math.min(SCALA_MAX, Math.max(SCALA_MIN, Math.min(perLarghezza, perAltezza)))
}

// Le schermate dell'app come quattro schede piccole: un'anteprima ritagliata e il titolo. Toccandone una si apre una finestra
// con la schermata ingrandita, il testo e due pulsanti per passare alla precedente e alla successiva (si può anche
// scorrere col dito o usare le frecce della tastiera). Usa l'elemento <dialog> del browser, che pensa lui a tenere il
// focus dentro la finestra, a chiuderla con Esc e a ridare il focus alla scheda toccata.
export function GalleriaSchermate({ voci }: { voci: VoceGalleria[] }) {
  const [indice, setIndice] = useState<number | null>(null)
  const [scala, setScala] = useState(1)
  const finestra = useRef<HTMLDialogElement>(null)
  const dito = useRef<{ inizio: number; ultimo: number } | null>(null)
  const aperta = indice !== null

  function apri(i: number) {
    const dialogo = finestra.current
    if (!dialogo || dialogo.open) return
    setScala(scalaPerLoSchermo())
    setIndice(i)
    dialogo.showModal()
  }

  function chiudi() {
    finestra.current?.close()
  }

  function vai(passo: number) {
    setIndice((prec) => (prec === null ? null : (prec + passo + voci.length) % voci.length))
  }

  // Finché la finestra è aperta: la pagina sotto non scorre e la grandezza segue lo schermo (se si gira il telefono).
  useEffect(() => {
    if (!aperta) return
    const adatta = () => setScala(scalaPerLoSchermo())
    window.addEventListener('resize', adatta)
    const html = document.documentElement
    const overflowPrima = html.style.overflow
    html.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('resize', adatta)
      html.style.overflow = overflowPrima
    }
  }, [aperta])

  const voce = indice === null ? null : voci[indice]

  return (
    <>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {voci.map((v, i) => (
          <li key={v.titolo} className="relative overflow-hidden rounded-3xl border border-bordo bg-carta">
            {/* Anteprima: il telefono rimpicciolito e tagliato in basso. È solo da vedere; a spiegare c'è il titolo. */}
            <div aria-hidden="true" className="relative h-40 overflow-hidden bg-carta-alta">
              <div className="absolute top-3 left-1/2 w-[240px] origin-top -translate-x-1/2 scale-[.55]">
                {v.schermata}
              </div>
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-linear-to-t from-carta-alta to-transparent" />
              <span className="absolute right-2 bottom-2 grid size-8 place-items-center rounded-full bg-inchiostro text-su-inchiostro">
                <IconaLente className="size-4" />
              </span>
            </div>
            <div className="p-3">
              <p className="font-extrabold">{v.titolo}</p>
              <p className="text-xs text-muto">Tocca per ingrandire</p>
            </div>
            {/* Il pulsante copre tutta la scheda: un tocco in qualunque punto la apre. */}
            <button
              type="button"
              onClick={() => apri(i)}
              aria-label={`Ingrandisci: ${v.titolo}`}
              className="absolute inset-0 rounded-3xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accento"
            />
          </li>
        ))}
      </ul>

      <dialog
        ref={finestra}
        aria-labelledby="titolo-schermata-aperta"
        onClose={() => setIndice(null)}
        // Un tocco sullo sfondo scuro (cioè sull'elemento <dialog> stesso, che ha il bordo a zero) chiude la finestra.
        onClick={(e) => {
          if (e.target === e.currentTarget) chiudi()
        }}
        onKeyDown={(e) => {
          if (e.key === 'ArrowLeft') vai(-1)
          if (e.key === 'ArrowRight') vai(1)
        }}
        className="m-auto max-h-[calc(100dvh_-_2rem)] w-[min(calc(100vw_-_2rem),28rem)] overflow-y-auto overscroll-contain rounded-3xl border border-bordo bg-carta p-0 text-testo shadow-xl backdrop:bg-inchiostro/70"
      >
        {voce && indice !== null && (
          <div className="space-y-3 p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-muto tabular-nums">
                {indice + 1} di {voci.length}
              </p>
              <button
                type="button"
                onClick={chiudi}
                aria-label="Chiudi"
                className="grid size-10 place-items-center rounded-full text-muto transition active:bg-carta-alta"
              >
                <IconaChiudi className="size-5" />
              </button>
            </div>

            {/* Il telefono alla sua grandezza vera, ingrandito con scale(): lo spazio è riservato per intero, così il resto non salta. */}
            <div
              className="mx-auto"
              style={{ width: LARGHEZZA_TELEFONO * scala, height: ALTEZZA_TELEFONO * scala }}
              onTouchStart={(e) => {
                const x = e.touches[0].clientX
                dito.current = { inizio: x, ultimo: x }
              }}
              onTouchMove={(e) => {
                if (dito.current) dito.current.ultimo = e.touches[0].clientX
              }}
              onTouchEnd={() => {
                const spostamento = dito.current ? dito.current.ultimo - dito.current.inizio : 0
                dito.current = null
                if (Math.abs(spostamento) > SOGLIA_SCORRIMENTO) vai(spostamento < 0 ? 1 : -1)
              }}
            >
              <div style={{ width: LARGHEZZA_TELEFONO, transform: `scale(${scala})`, transformOrigin: 'top left' }}>
                {voce.schermata}
              </div>
            </div>

            <div className="space-y-1">
              <h3 id="titolo-schermata-aperta" className="text-lg font-extrabold">
                {voce.titolo}
              </h3>
              <p className="text-sm text-muto">{voce.testo}</p>
            </div>

            <div className="flex gap-2">
              {/* Sotto i 360 punti le due parole non stanno nella finestra: restano le frecce, e lo screen reader legge il nome. */}
              <button type="button" onClick={() => vai(-1)} className={`${stileBottoneChiaro} min-w-0 flex-1 !py-3`}>
                <IconaSinistra className="size-4" />
                <span className="max-[359px]:sr-only">Precedente</span>
              </button>
              <button type="button" onClick={() => vai(1)} className={`${stileBottoneChiaro} min-w-0 flex-1 !py-3`}>
                <span className="max-[359px]:sr-only">Successiva</span>
                <IconaDestra className="size-4" />
              </button>
            </div>
          </div>
        )}
      </dialog>
    </>
  )
}
