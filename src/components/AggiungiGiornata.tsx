'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { aggiungiGiornata } from '@/app/actions'
import { IconaPiu } from './icone'

// Il "+" in fondo alle linguette delle giornate: crea la giornata successiva e porta subito a riempirla.
export function AggiungiGiornata() {
  const router = useRouter()
  const [inCorso, startTransition] = useTransition()

  function aggiungi() {
    startTransition(async () => {
      const esito = await aggiungiGiornata()
      if ('errore' in esito) {
        window.alert(esito.errore)
        return
      }
      router.push(`/scheda/modifica?r=${esito.id}`)
    })
  }

  return (
    <button
      type="button"
      onClick={aggiungi}
      disabled={inCorso}
      aria-label="Aggiungi una giornata"
      className="grid h-full w-full place-items-center rounded-[1.25rem] px-2 py-2 text-muto active:bg-carta disabled:opacity-50"
    >
      <IconaPiu className="size-5" />
    </button>
  )
}
