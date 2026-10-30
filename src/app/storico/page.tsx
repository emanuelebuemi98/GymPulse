import type { Metadata } from 'next'
import Link from 'next/link'
import { formatData, formatNumero } from '@/lib/formato'
import { elencoSessioni } from '@/lib/storico'

// Legge il database a ogni richiesta: l'elenco cambia dopo ogni allenamento salvato.
export const dynamic = 'force-dynamic'

export const metadata: Metadata = { title: 'Storico' }

export default async function StoricoPage() {
  const sessioni = await elencoSessioni()

  return (
    <div className="space-y-6">
      <section>
        <h1 className="text-2xl font-bold">Storico</h1>
        <p className="text-slate-400">Allenamenti registrati, dal più recente.</p>
      </section>

      {sessioni.length === 0 ? (
        <p className="rounded-xl border border-slate-800 bg-slate-900 p-4 text-slate-400">
          Non hai ancora registrato allenamenti.{' '}
          <Link href="/" className="text-blue-400 underline">
            Apri la scheda
          </Link>
        </p>
      ) : (
        <ul className="space-y-2">
          {sessioni.map((sessione) => (
            <li key={sessione.id}>
              <Link
                href={`/storico/${sessione.id}`}
                className="block rounded-xl border border-slate-800 bg-slate-900 p-4 hover:border-slate-700"
              >
                <div className="flex items-baseline justify-between gap-3">
                  <span className="font-semibold">
                    Giorno {sessione.giornoNumero}: {sessione.giornoTitolo}
                  </span>
                  <time dateTime={sessione.data.toISOString()} className="shrink-0 text-sm text-slate-400">
                    {formatData(sessione.data)}
                  </time>
                </div>
                <p className="mt-1 text-sm text-slate-400">
                  {sessione.numeroSerie} serie
                  {sessione.volumeKg > 0 && ` · ${formatNumero(sessione.volumeKg, 0)} kg di volume`}
                  {sessione.durataMinuti !== null && ` · ${sessione.durataMinuti} min`}
                  {sessione.kcalStimate !== null && ` · ~${sessione.kcalStimate} kcal`}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
