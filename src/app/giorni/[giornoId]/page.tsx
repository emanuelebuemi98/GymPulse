import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { FormSessione } from '@/components/FormSessione'
import { trovaGiorno } from '@/data/scheda'
import { suggerisciCarichi } from '@/lib/progressi'
import { ultimaSessioneDelGiorno } from '@/lib/sessioni'

// Legge il database a ogni richiesta: lo storico cambia dopo ogni allenamento.
export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ giornoId: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { giornoId } = await params
  const giorno = trovaGiorno(giornoId)
  return { title: giorno ? `Giorno ${giorno.numero}: ${giorno.titolo}` : 'Giorno non trovato' }
}

export default async function GiornoPage({ params }: Props) {
  const { giornoId } = await params
  const giorno = trovaGiorno(giornoId)
  if (!giorno) notFound()

  const ultima = await ultimaSessioneDelGiorno(giorno.id)
  const suggerimenti = suggerisciCarichi(giorno.esercizi, ultima)

  return (
    <div className="space-y-6">
      <section>
        <p className="text-sm text-slate-400">Giorno {giorno.numero}</p>
        <h1 className="text-2xl font-bold">{giorno.titolo}</h1>
        <p className="text-slate-400">{giorno.focus}</p>
        {ultima && (
          <p className="mt-2 text-sm text-slate-500">
            Valori precompilati dall&apos;ultimo allenamento di questo giorno.
          </p>
        )}
      </section>

      <FormSessione giorno={giorno} ultima={ultima} suggerimenti={suggerimenti} />
    </div>
  )
}
