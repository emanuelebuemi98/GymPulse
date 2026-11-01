'use client'

import { useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { importaCsv } from '@/app/actions'
import { IconaCarica, IconaScarica, IconaScudo } from './icone'
import { stileBottoneChiaro, stileCarta } from './stili'

// Stesso limite di LIMITE_CSV in lib/csv.ts: il file si scarta prima di inviarlo.
const LIMITE_CSV = 900_000

const sedute = (n: number) => (n === 1 ? '1 seduta' : `${n} sedute`)

export function CsvSedute({ utenteId }: { utenteId: number }) {
  const router = useRouter()
  const file = useRef<HTMLInputElement>(null)
  const [messaggio, setMessaggio] = useState<{ testo: string; errore: boolean } | null>(null)
  const [inCorso, startTransition] = useTransition()

  async function alScelto(evento: React.ChangeEvent<HTMLInputElement>) {
    const scelto = evento.target.files?.[0]
    evento.target.value = ''
    if (!scelto) return
    setMessaggio(null)

    if (scelto.size > LIMITE_CSV) {
      setMessaggio({ testo: 'Il file è troppo grande per essere importato', errore: true })
      return
    }

    const testo = await scelto.text()
    startTransition(async () => {
      const esito = await importaCsv(utenteId, testo)
      if ('errore' in esito) {
        setMessaggio({ testo: esito.errore, errore: true })
        return
      }
      const presenti = esito.giaPresenti > 0 ? ` (${esito.giaPresenti} erano già presenti)` : ''
      setMessaggio({
        testo:
          esito.aggiunte === 0
            ? `Nessuna seduta nuova: erano già tutte presenti`
            : `Importate ${sedute(esito.aggiunte)}${presenti}`,
        errore: false,
      })
      router.refresh()
    })
  }

  return (
    <section className={`${stileCarta} space-y-3 p-4`}>
      <h2 className="text-lg font-extrabold">Sedute in CSV</h2>
      <p className="flex gap-2 text-sm text-muto">
        <IconaScudo className="mt-0.5 size-4 shrink-0 text-attenzione" />
        Esporta le tue sedute in un file che si apre anche in Excel. Importando un file, le sedute nuove si
        aggiungono e quelle già presenti non si duplicano. La scheda non è inclusa.
      </p>
      <div className="grid grid-cols-2 gap-2">
        <a href="/api/export" download className={stileBottoneChiaro}>
          <IconaScarica className="size-4" />
          Esporta
        </a>
        <button type="button" disabled={inCorso} onClick={() => file.current?.click()} className={stileBottoneChiaro}>
          <IconaCarica className="size-4" />
          {inCorso ? 'Importo…' : 'Importa'}
        </button>
      </div>
      <input ref={file} type="file" accept=".csv,text/csv" onChange={alScelto} className="hidden" />
      {messaggio && (
        <p role={messaggio.errore ? 'alert' : 'status'} className={`text-sm ${messaggio.errore ? 'text-errore' : 'text-ok'}`}>
          {messaggio.testo}
        </p>
      )}
    </section>
  )
}
