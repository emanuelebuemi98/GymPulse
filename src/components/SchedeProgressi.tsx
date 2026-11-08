import Link from 'next/link'

type Props = {
  attiva: 'panoramica' | 'esercizio'
  primoEsercizio: number
}

const base = 'flex-1 rounded-full px-4 py-2 text-center text-sm font-bold transition'
const stileAttiva = `${base} bg-carta text-testo shadow-[0_1px_2px_color-mix(in_srgb,var(--color-testo)_14%,transparent)]`
const stileInattiva = `${base} text-muto active:bg-carta/60`

// Le due viste della pagina Progressi. Sono link, non stato: ogni vista ha il suo indirizzo e si può ricaricare.
export function SchedeProgressi({ attiva, primoEsercizio }: Props) {
  return (
    <nav aria-label="Vista dei progressi" className="flex gap-1 rounded-full bg-carta-alta p-1">
      <Link
        href="/progressi"
        aria-current={attiva === 'panoramica' ? 'page' : undefined}
        className={attiva === 'panoramica' ? stileAttiva : stileInattiva}
      >
        Panoramica
      </Link>
      <Link
        href={`/progressi?e=${primoEsercizio}`}
        aria-current={attiva === 'esercizio' ? 'page' : undefined}
        className={attiva === 'esercizio' ? stileAttiva : stileInattiva}
      >
        Per esercizio
      </Link>
    </nav>
  )
}
