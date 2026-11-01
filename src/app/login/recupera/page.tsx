import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { FormRecupero } from '@/components/FormRecupero'
import { stileCarta } from '@/components/stili'
import { haAccesso } from '@/lib/accesso'
import { emailAttiva } from '@/lib/email'

// Legge il cookie a ogni richiesta.
export const dynamic = 'force-dynamic'

export const metadata: Metadata = { title: 'Password dimenticata' }

export default async function RecuperaPage() {
  if (await haAccesso()) redirect('/account')

  return (
    <div className="mx-auto max-w-sm space-y-6 pt-10">
      <header className="space-y-2 text-center">
        <p className="flex items-center justify-center gap-2 text-lg font-extrabold tracking-tight">
          <span aria-hidden="true" className="size-2.5 rounded-full bg-accento" />
          GymPulse
        </p>
        <h1 className="text-3xl font-extrabold tracking-tight">Password dimenticata</h1>
        <p className="text-muto">Scrivi il tuo nome utente: ti mando un&apos;email con un codice.</p>
      </header>

      {emailAttiva() ? (
        <section className={`${stileCarta} p-5`}>
          <FormRecupero />
        </section>
      ) : (
        <p role="status" className="rounded-2xl bg-attenzione/15 p-4 text-sm text-attenzione">
          Il recupero con l&apos;email non è attivo su questo server.
        </p>
      )}

      <p className="text-center text-sm text-muto">
        <Link href="/login" className="font-semibold text-accento underline">
          Torna all&apos;accesso
        </Link>
      </p>
    </div>
  )
}
