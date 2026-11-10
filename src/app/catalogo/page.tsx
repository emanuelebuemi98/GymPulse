import type { Metadata } from 'next'
import Link from 'next/link'
import { CatalogoCompleto } from '@/components/CatalogoCompleto'
import { IconaSinistra } from '@/components/icone'
import { richiediUtente } from '@/lib/accesso'
import { leggiCatalogo } from '@/lib/catalogo-db'

// Legge il database a ogni richiesta: il catalogo si aggiorna con `npm run db:catalogo`.
export const dynamic = 'force-dynamic'

export const metadata: Metadata = { title: 'Catalogo esercizi' }

export default async function CatalogoPage() {
  await richiediUtente()
  const voci = await leggiCatalogo()

  return (
    <div className="space-y-5">
      <Link href="/scheda" className="inline-flex items-center gap-1 text-sm font-semibold text-accento">
        <IconaSinistra className="size-4" />
        Torna alla scheda
      </Link>

      <header className="space-y-1">
        <h1 className="text-3xl font-extrabold tracking-tight">Catalogo esercizi</h1>
        <p className="text-muto">
          {voci.length} esercizi divisi per categoria. Tocca un esercizio per vedere la foto e come si fa. Per aggiungerlo a una
          giornata usa <span className="font-semibold text-testo">Modifica</span> nella pagina Scheda.
        </p>
      </header>

      <CatalogoCompleto voci={voci} />
    </div>
  )
}
