'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const voci = [
  { href: '/home', etichetta: 'Home', radici: [] as string[] },
  { href: '/scheda', etichetta: 'Scheda', radici: ['/sessione'] },
  { href: '/storico', etichetta: 'Storico', radici: [] },
  { href: '/progressi', etichetta: 'Progressi', radici: [] },
]

function èAttiva(percorso: string, href: string, radici: string[]): boolean {
  return [href, ...radici].some((radice) => percorso === radice || percorso.startsWith(`${radice}/`))
}

// Menu in alto, come linguette sottolineate: la voce attiva ha la riga color accento.
export function NavSuperiore() {
  const percorso = usePathname()

  return (
    <nav aria-label="Navigazione principale">
      <ul className="-mb-px flex">
        {voci.map(({ href, etichetta, radici }) => {
          const attiva = èAttiva(percorso, href, radici)
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                aria-current={attiva ? 'page' : undefined}
                className={`block border-b-[3px] py-3 text-center text-sm font-bold ${
                  attiva ? 'border-accento text-testo' : 'border-transparent text-muto'
                }`}
              >
                {etichetta}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
