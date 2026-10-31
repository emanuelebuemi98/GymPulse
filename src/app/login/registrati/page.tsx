import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { FormRegistrazione } from '@/components/FormRegistrazione'
import { stileCarta } from '@/components/stili'
import { haAccesso } from '@/lib/accesso'

// Legge il cookie a ogni richiesta.
export const dynamic = 'force-dynamic'

export const metadata: Metadata = { title: 'Crea account' }

export default async function RegistratiPage() {
  if (await haAccesso()) redirect('/')

  return (
    <div className="mx-auto max-w-sm space-y-6 pt-10">
      <header className="space-y-2 text-center">
        <p className="flex items-center justify-center gap-2 text-lg font-extrabold tracking-tight">
          <span aria-hidden="true" className="size-2.5 rounded-full bg-accento" />
          GymPulse
        </p>
        <h1 className="text-3xl font-extrabold tracking-tight">Crea account</h1>
        <p className="text-muto">Avrai la tua scheda e il tuo storico, separati da quelli degli altri.</p>
      </header>

      <section className={`${stileCarta} p-5`}>
        <FormRegistrazione />
      </section>

      <p className="text-center text-sm text-muto">
        Hai già un account?{' '}
        <Link href="/login" className="font-semibold text-accento underline">
          Accedi
        </Link>
      </p>
    </div>
  )
}
