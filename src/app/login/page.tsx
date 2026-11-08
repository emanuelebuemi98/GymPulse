import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { FormLogin } from '@/components/FormLogin'
import { LogoGymPulse } from '@/components/Logo'
import { stileCarta } from '@/components/stili'
import { haAccesso } from '@/lib/accesso'
import { percorsoSicuro, valutaSegreto } from '@/lib/sessione-auth'
import { primoParametro } from '@/lib/url'

// Legge il cookie a ogni richiesta.
export const dynamic = 'force-dynamic'

export const metadata: Metadata = { title: 'Accedi' }

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> }

export default async function LoginPage({ searchParams }: Props) {
  const parametri = await searchParams
  const da = percorsoSicuro(primoParametro(parametri.da))
  const reimpostata = primoParametro(parametri.r) === '1'
  if (await haAccesso()) redirect(da)

  // In sviluppo dico cosa manca; online non svelo nulla (il dettaglio resta nel log del server).
  const segreto = valutaSegreto(process.env.AUTH_SECRET)
  const suggerimento = !segreto.ok && process.env.NODE_ENV !== 'production' ? segreto.problema : null

  return (
    <div className="mx-auto max-w-sm space-y-6 pt-10">
      <header className="space-y-2 text-center">
        <Link href="/" aria-label="GymPulse, torna alla presentazione">
          <LogoGymPulse />
        </Link>
        <h1 className="text-3xl font-extrabold tracking-tight">Accedi</h1>
        <p className="text-muto">Il tuo diario di allenamento è privato.</p>
      </header>

      {reimpostata && (
        <p role="status" className="rounded-2xl bg-ok/10 p-3 text-center text-sm font-semibold text-ok">
          Password cambiata. Le sessioni aperte sono state chiuse: accedi con la password nuova.
        </p>
      )}

      <section className={`${stileCarta} p-5`}>
        <FormLogin da={da} />
      </section>

      <div className="space-y-2 text-center text-sm text-muto">
        <p>
          <Link href="/login/recupera" className="font-semibold text-accento underline">
            Password dimenticata?
          </Link>
        </p>
        <p>
          Non hai un account?{' '}
          <Link href="/registrati" className="font-semibold text-accento underline">
            Creane uno
          </Link>
        </p>
      </div>

      {suggerimento && (
        <p role="status" className="rounded-2xl bg-attenzione/15 p-3 text-sm text-attenzione">
          Accesso non configurato: {suggerimento}. Imposta AUTH_SECRET (almeno 32 caratteri) nel file .env e
          riavvia il server.
        </p>
      )}
    </div>
  )
}
