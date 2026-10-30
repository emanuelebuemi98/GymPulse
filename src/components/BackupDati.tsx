'use client'

import { useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { importaBackup } from '@/app/actions'
import { IconaCarica, IconaScarica, IconaScudo } from './icone'
import { stileBottoneChiaro, stileCarta } from './stili'

export function BackupDati() {
  const router = useRouter()
  const file = useRef<HTMLInputElement>(null)
  const [messaggio, setMessaggio] = useState<{ testo: string; errore: boolean } | null>(null)
  const [inCorso, startTransition] = useTransition()

  async function alScelto(evento: React.ChangeEvent<HTMLInputElement>) {
    const scelto = evento.target.files?.[0]
    evento.target.value = ''
    if (!scelto) return
    setMessaggio(null)

    if (scelto.size > 900_000) {
      setMessaggio({ testo: 'Il file è troppo grande per essere importato', errore: true })
      return
    }
    const confermato = window.confirm(
      'Importare il backup sostituisce scheda, esercizi e tutte le sedute di questo dispositivo. Continuare?',
    )
    if (!confermato) return

    const testo = await scelto.text()
    startTransition(async () => {
      const esito = await importaBackup(testo)
      if ('errore' in esito) {
        setMessaggio({ testo: esito.errore, errore: true })
        return
      }
      setMessaggio({ testo: `Backup importato: ${esito.sedute} sedute`, errore: false })
      router.refresh()
    })
  }

  return (
    <section className={`${stileCarta} space-y-3 p-4`}>
      <h2 className="text-lg font-extrabold">Backup</h2>
      <p className="flex gap-2 text-sm text-muto">
        <IconaScudo className="mt-0.5 size-4 shrink-0 text-attenzione" />
        Esporta un backup JSON ogni tanto: contiene scheda, esercizi e tutte le sedute.
      </p>
      <div className="grid grid-cols-2 gap-2">
        <a href="/api/backup" download className={stileBottoneChiaro}>
          <IconaScarica className="size-4" />
          Esporta
        </a>
        <button type="button" disabled={inCorso} onClick={() => file.current?.click()} className={stileBottoneChiaro}>
          <IconaCarica className="size-4" />
          {inCorso ? 'Importo…' : 'Importa'}
        </button>
      </div>
      <input ref={file} type="file" accept="application/json,.json" onChange={alScelto} className="hidden" />
      {messaggio && (
        <p role={messaggio.errore ? 'alert' : 'status'} className={`text-sm ${messaggio.errore ? 'text-errore' : 'text-ok'}`}>
          {messaggio.testo}
        </p>
      )}
    </section>
  )
}
