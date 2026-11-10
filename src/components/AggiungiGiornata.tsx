'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { aggiungiGiornata } from '@/app/actions'
import { aggiungiGiornataAllievo } from '@/app/trainer/actions'
import { IconaPiu } from './icone'

// Il "+" in fondo alle linguette delle giornate: crea la giornata successiva e porta subito a riempirla. Per un personal trainer
// `allievoId` è l'utente di cui è la scheda e `modifica` la pagina dell'editor (/trainer/12/modifica).
export function AggiungiGiornata({
  utenteId,
  allievoId,
  modifica = '/scheda/modifica',
}: {
  utenteId: number
  allievoId?: number
  modifica?: string
}) {
  const router = useRouter()
  const [inCorso, startTransition] = useTransition()

  function aggiungi() {
    startTransition(async () => {
      const esito = allievoId === undefined ? await aggiungiGiornata(utenteId) : await aggiungiGiornataAllievo(utenteId, allievoId)
      if ('errore' in esito) {
        window.alert(esito.errore)
        return
      }
      router.push(`${modifica}?r=${esito.id}`)
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
