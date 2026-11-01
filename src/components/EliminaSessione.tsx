'use client'

import { useState, useTransition } from 'react'
import { eliminaSessione } from '@/app/actions'
import { IconaCestino } from './icone'

export function EliminaSessione({ utenteId, id }: { utenteId: number; id: number }) {
  const [errore, setErrore] = useState<string | null>(null)
  const [inCorso, startTransition] = useTransition()

  function elimina() {
    if (!window.confirm('Eliminare questa seduta? Non si può annullare.')) return
    setErrore(null)
    startTransition(async () => {
      const esito = await eliminaSessione(utenteId, id)
      if (esito && 'errore' in esito) setErrore(esito.errore)
    })
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={elimina}
        disabled={inCorso}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-errore/10 px-4 py-3 text-sm font-semibold text-errore disabled:opacity-50"
      >
        <IconaCestino className="size-4" />
        {inCorso ? 'Elimino…' : 'Elimina seduta'}
      </button>
      {errore && (
        <p role="alert" className="text-sm text-errore">
          {errore}
        </p>
      )}
    </div>
  )
}
