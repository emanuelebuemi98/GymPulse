import Link from 'next/link'
import type { ReactNode } from 'react'

type Props = {
  giorni: { id: string; titolo: string }[]
  attivo: string
  percorso: string
  // Un controllo in più in fondo alle linguette (il "+" per aggiungere una giornata).
  aggiungi?: ReactNode
}

// Con più di quattro giornate le linguette sono strette: restano le sole sigle, il titolo si legge sotto, nell'intestazione.
const GIORNATE_CON_TITOLO = 4

// Le giornate come controllo segmentato: ogni voce è un link, quindi funziona anche senza JavaScript.
export function TabGiorni({ giorni, attivo, percorso, aggiungi }: Props) {
  const conTitolo = giorni.length <= GIORNATE_CON_TITOLO
  return (
    <ul className="grid auto-cols-fr grid-flow-col gap-1 rounded-3xl bg-carta-alta p-1" aria-label="Giornata">
      {giorni.map((giorno) => {
        const èAttivo = giorno.id === attivo
        return (
          <li key={giorno.id} className="min-w-0">
            <Link
              href={`${percorso}?r=${giorno.id}`}
              aria-current={èAttivo ? 'page' : undefined}
              aria-label={conTitolo ? undefined : `${giorno.id}: ${giorno.titolo}`}
              className={`block rounded-[1.25rem] px-2 py-2 text-center ${
                èAttivo ? 'bg-carta text-testo shadow-sm' : 'text-muto'
              }`}
            >
              <span className="block text-lg leading-tight font-extrabold">{giorno.id}</span>
              {conTitolo && <span className="block truncate text-[11px] font-medium">{giorno.titolo}</span>}
            </Link>
          </li>
        )
      })}
      {aggiungi && <li className="min-w-0">{aggiungi}</li>}
    </ul>
  )
}
