'use client'

import { useEffect, useId, useRef, type ReactNode } from 'react'
import { stileBottoneChiaro } from './stili'

type Props = {
  aperta: boolean
  titolo: string
  // Un testo facoltativo che spiega cosa succede, sotto il titolo. Spesso basta il titolo, in forma di domanda.
  children?: ReactNode
  testoConferma: string
  testoInCorso?: string
  testoAnnulla?: string
  // Un'azione che distrugge dati: il pulsante di conferma è rosso e il focus parte su «Annulla», non sulla conferma.
  pericolo?: boolean
  // Mentre l'azione è in corso la finestra resta aperta, i pulsanti sono spenti e Esc e il tocco sullo sfondo non la chiudono.
  inCorso?: boolean
  alConferma: () => void
  alAnnulla: () => void
}

// Una finestra di conferma con i colori dell'app, al posto di window.confirm (quello del browser non segue il tema, chiaro o scuro).
// Usa l'elemento <dialog> del browser, che pensa lui a tenere il focus dentro la finestra, a rendere inerte il resto della pagina e a
// chiuderla con Esc; è la stessa tecnica della galleria della pagina iniziale. Il primo pulsante nel documento è «Annulla»: è
// quello su cui il browser mette il focus all'apertura, così Invio per sbaglio non cancella niente.
export function FinestraConferma({
  aperta,
  titolo,
  children,
  testoConferma,
  testoInCorso = 'Un attimo…',
  testoAnnulla = 'Annulla',
  pericolo = false,
  inCorso = false,
  alConferma,
  alAnnulla,
}: Props) {
  const finestra = useRef<HTMLDialogElement>(null)
  const idTitolo = useId()
  const idTesto = useId()

  // Apre e chiude il <dialog> seguendo `aperta`.
  useEffect(() => {
    const dialogo = finestra.current
    if (!dialogo) return
    if (aperta && !dialogo.open) dialogo.showModal()
    if (!aperta && dialogo.open) dialogo.close()
  }, [aperta])

  // Finché è aperta la pagina sotto non scorre.
  useEffect(() => {
    if (!aperta) return
    const html = document.documentElement
    const prima = html.style.overflow
    html.style.overflow = 'hidden'
    return () => {
      html.style.overflow = prima
    }
  }, [aperta])

  return (
    <dialog
      ref={finestra}
      role="alertdialog"
      aria-labelledby={idTitolo}
      aria-describedby={children ? idTesto : undefined}
      // Esc: si gestisce da qui, per poterlo ignorare mentre l'azione è in corso.
      onCancel={(e) => {
        e.preventDefault()
        if (!inCorso) alAnnulla()
      }}
      // Un tocco sullo sfondo scuro (cioè sull'elemento <dialog> stesso, che non ha spazio interno) annulla.
      onClick={(e) => {
        if (e.target === e.currentTarget && !inCorso) alAnnulla()
      }}
      className="m-auto w-[min(calc(100vw_-_2rem),26rem)] overflow-y-auto overscroll-contain rounded-3xl border border-bordo bg-carta p-0 text-testo shadow-xl backdrop:bg-inchiostro/70"
    >
      {aperta && (
        <div className="space-y-4 p-5">
          <h2 id={idTitolo} className="text-xl leading-tight font-extrabold">
            {titolo}
          </h2>
          {children && (
            <div id={idTesto} className="space-y-2 text-sm text-muto">
              {children}
            </div>
          )}

          <div className="flex flex-col gap-2 pt-1">
            <button type="button" disabled={inCorso} onClick={alAnnulla} className={`${stileBottoneChiaro} w-full !py-3.5 !text-base`}>
              {testoAnnulla}
            </button>
            <button
              type="button"
              disabled={inCorso}
              onClick={alConferma}
              className={`w-full rounded-full px-5 py-3.5 text-base font-extrabold text-su-accento transition active:opacity-80 disabled:opacity-50 ${
                pericolo ? 'bg-errore' : 'bg-accento'
              }`}
            >
              {inCorso ? testoInCorso : testoConferma}
            </button>
          </div>
        </div>
      )}
    </dialog>
  )
}
