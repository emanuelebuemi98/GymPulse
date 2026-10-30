import Link from 'next/link'

type Props = {
  giorni: { id: string; titolo: string }[]
  attivo: string
  percorso: string
}

// A / B / C come controllo segmentato: ogni voce è un link, quindi funziona anche senza JavaScript.
export function TabGiorni({ giorni, attivo, percorso }: Props) {
  return (
    <ul className="grid auto-cols-fr grid-flow-col gap-1 rounded-3xl bg-carta-alta p-1" aria-label="Giornata">
      {giorni.map((giorno) => {
        const èAttivo = giorno.id === attivo
        return (
          <li key={giorno.id} className="min-w-0">
            <Link
              href={`${percorso}?r=${giorno.id}`}
              aria-current={èAttivo ? 'page' : undefined}
              className={`block rounded-[1.25rem] px-2 py-2 text-center ${
                èAttivo ? 'bg-carta text-testo shadow-sm' : 'text-muto'
              }`}
            >
              <span className="block text-lg leading-tight font-extrabold">{giorno.id}</span>
              <span className="block truncate text-[11px] font-medium">{giorno.titolo}</span>
            </Link>
          </li>
        )
      })}
    </ul>
  )
}
