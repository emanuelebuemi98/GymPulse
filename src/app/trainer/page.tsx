import type { Metadata } from 'next'
import Link from 'next/link'
import { stileCarta } from '@/components/stili'
import { richiediTrainer } from '@/lib/accesso'
import { leggiAllievi } from '@/lib/trainer-db'

// Legge il database a ogni richiesta: chi sceglie o toglie la palestra compare o sparisce subito.
export const dynamic = 'force-dynamic'

export const metadata: Metadata = { title: 'I tuoi allievi' }

export default async function AllieviPage() {
  const { palestra } = await richiediTrainer()
  const allievi = await leggiAllievi(palestra)

  return (
    <div className="space-y-5">
      <header className="space-y-1">
        <h1 className="text-3xl font-extrabold tracking-tight">I tuoi allievi</h1>
        <p className="text-muto">
          Gli utenti di <span className="font-semibold text-testo">{palestra}</span> che hanno scelto la tua palestra. Vedi il nome e la
          scheda, e puoi modificarla; non vedi i kg che sollevano né lo storico degli allenamenti.
        </p>
      </header>

      {allievi.length === 0 ? (
        <p className={`${stileCarta} p-4 text-muto`}>Nessun utente ha ancora scelto la tua palestra.</p>
      ) : (
        <ul className="space-y-2">
          {allievi.map((allievo) => (
            <li key={allievo.id}>
              <Link
                href={`/trainer/${allievo.id}`}
                className={`${stileCarta} flex items-center justify-between gap-3 px-4 py-3.5 active:bg-carta-alta`}
              >
                <span className="min-w-0 truncate font-bold">{allievo.fullName}</span>
                <span aria-hidden="true" className="text-muto">
                  ›
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
