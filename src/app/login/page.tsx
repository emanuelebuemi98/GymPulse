import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { FormLogin } from '@/components/FormLogin'
import { stileCarta } from '@/components/stili'
import { haAccesso } from '@/lib/accesso'
import { percorsoSicuro, valutaSegreto } from '@/lib/sessione-auth'
import { primoParametro } from '@/lib/url'

// Legge il cookie a ogni richiesta.
export const dynamic = 'force-dynamic'

export const metadata: Metadata = { title: 'Accedi' }

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> }

export default async function LoginPage({ searchParams }: Props) {
  const da = percorsoSicuro(primoParametro((await searchParams).da))
  if (await haAccesso()) redirect(da)

  // In sviluppo dico cosa manca; online non svelo nulla (il dettaglio resta nel log del server).
  const segreto = valutaSegreto(process.env.AUTH_SECRET)
  const suggerimento = !segreto.ok && process.env.NODE_ENV !== 'production' ? segreto.problema : null

  return (
    <div className="mx-auto max-w-sm space-y-6 pt-10">
      <header className="space-y-2 text-center">
        <p className="flex items-center justify-center gap-2 text-lg font-extrabold tracking-tight">
          <span aria-hidden="true" className="size-2.5 rounded-full bg-accento" />
          GymPulse
        </p>
        <h1 className="text-3xl font-extrabold tracking-tight">Accedi</h1>
        <p className="text-muto">Il tuo diario di allenamento è privato.</p>
      </header>

      <section className={`${stileCarta} p-5`}>
        <FormLogin da={da} />
      </section>

      <p className="text-center text-sm text-muto">
        Non hai un account?{' '}
        <Link href="/login/registrati" className="font-semibold text-accento underline">
          Creane uno
        </Link>
      </p>

      {suggerimento && (
        <p role="status" className="rounded-2xl bg-attenzione/15 p-3 text-sm text-attenzione">
          Accesso non configurato: {suggerimento}. Imposta AUTH_SECRET (almeno 32 caratteri) nel file .env e
          riavvia il server.
        </p>
      )}
    </div>
  )
}
