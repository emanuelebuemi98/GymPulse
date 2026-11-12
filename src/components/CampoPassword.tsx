'use client'

import { useId, useRef, useState, type InputHTMLAttributes, type ReactNode } from 'react'
import { IconaOcchio, IconaOcchioBarrato } from './icone'
import { stileTesto } from './stili'

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'className'> & {
  etichetta: string
  // Una riga di spiegazione sotto il campo (per esempio "Almeno 8 caratteri.").
  nota?: ReactNode
}

// Un campo password con il pulsante «occhio» per vedere quello che si sta scrivendo, e controllare di non aver sbagliato.
// L'elemento è sempre lo stesso e cambia solo il tipo: il testo già scritto non si perde. Il pulsante sta dentro il campo,
// a destra, e il campo lascia lo spazio per non scrivergli sotto.
//
// Fatto per il dito sul telefono, come il pulsante sole/luna:
// - il pulsante NON sta dentro il <label>: un tocco lì dentro può riattivare anche il campo (e far uscire la tastiera), e il
//   nome del campo per i lettori di schermo diventerebbe «Password Mostra la password». Etichetta e campo sono legati da id.
// - al tocco il campo non perde il focus (`onMouseDown`): altrimenti la tastiera si chiude, la pagina si sposta nel mezzo del
//   tocco e il tocco va a vuoto. Il cursore resta dov'era anche dopo il cambio.
// - area di tocco larga 44 punti, `touch-manipulation` (niente zoom con il doppio tocco) e lo stesso feedback del tema.
export function CampoPassword({ etichetta, nota, id, ...resto }: Props) {
  const [mostra, setMostra] = useState(false)
  const idGenerato = useId()
  const idCampo = id ?? idGenerato
  const idNota = `${idCampo}-nota`
  const campo = useRef<HTMLInputElement>(null)

  function cambia() {
    const input = campo.current
    // Se si sta scrivendo, dopo il cambio il campo resta attivo e il cursore torna dov'era (alcuni browser lo spostano).
    const attivo = input !== null && document.activeElement === input
    const inizio = input?.selectionStart ?? null
    const fine = input?.selectionEnd ?? null
    setMostra((visibile) => !visibile)
    if (attivo && input) {
      requestAnimationFrame(() => {
        input.focus({ preventScroll: true })
        if (inizio !== null && fine !== null) input.setSelectionRange(inizio, fine)
      })
    }
  }

  return (
    <div className="space-y-1 text-sm font-semibold text-muto">
      <label htmlFor={idCampo} className="block">
        {etichetta}
      </label>
      <div className="relative">
        <input
          {...resto}
          id={idCampo}
          ref={campo}
          type={mostra ? 'text' : 'password'}
          aria-describedby={nota ? idNota : undefined}
          // Con il testo in chiaro il telefono non deve correggerlo né metterci le maiuscole.
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          className={`${stileTesto} pe-14 text-left`}
        />
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={cambia}
          aria-label="Mostra la password"
          aria-pressed={mostra}
          className="absolute inset-y-1 right-1 grid w-11 touch-manipulation place-items-center rounded-full text-muto transition active:bg-carta-alta"
        >
          {mostra ? <IconaOcchioBarrato className="size-5" /> : <IconaOcchio className="size-5" />}
        </button>
      </div>
      {nota && (
        <span id={idNota} className="block text-xs font-normal">
          {nota}
        </span>
      )}
    </div>
  )
}
