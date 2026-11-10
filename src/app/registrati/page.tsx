import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { FormRegistrazione } from '@/components/FormRegistrazione'
import { LogoGymPulse } from '@/components/Logo'
import { stileCarta } from '@/components/stili'
import { haAccesso } from '@/lib/accesso'
import { registrazioneTrainerAttiva } from '@/lib/codice-trainer'

// Legge il cookie a ogni richiesta.
export const dynamic = 'force-dynamic'

export const metadata: Metadata = { title: 'Crea account' }

export default async function RegistratiPage() {
  if (await haAccesso()) redirect('/home')

  return (
    <div className="mx-auto max-w-sm space-y-6 pt-10">
      <header className="space-y-2 text-center">
        <Link href="/" aria-label="GymPulse, torna alla presentazione">
          <LogoGymPulse />
        </Link>
        <h1 className="text-3xl font-extrabold tracking-tight">Crea account</h1>
        <p className="text-muto">Avrai la tua scheda e il tuo storico, separati da quelli degli altri.</p>
      </header>

      <section className={`${stileCarta} p-5`}>
        <FormRegistrazione trainerAttivo={registrazioneTrainerAttiva()} />
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
