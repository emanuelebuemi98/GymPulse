import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { formatData, formatNumero } from '@/lib/formato'
import { dettaglioSessione } from '@/lib/storico'

// Legge il database a ogni richiesta: il dettaglio viene dal database.
export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ sessioneId: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { sessioneId } = await params
  const sessione = await dettaglioSessione(sessioneId)
  return { title: sessione ? `Allenamento del ${formatData(sessione.data)}` : 'Allenamento non trovato' }
}

export default async function DettaglioSessionePage({ params }: Props) {
  const { sessioneId } = await params
  const sessione = await dettaglioSessione(sessioneId)
  if (!sessione) notFound()

  return (
    <div className="space-y-6">
      <section>
        <Link href="/storico" className="text-sm text-blue-400 hover:underline">
          ← Storico
        </Link>
        <h1 className="mt-2 text-2xl font-bold">
          Giorno {sessione.giornoNumero}: {sessione.giornoTitolo}
        </h1>
        <p className="text-slate-400">
          <time dateTime={sessione.data.toISOString()}>{formatData(sessione.data)}</time>
          {sessione.durataMinuti !== null && ` · ${sessione.durataMinuti} min`}
          {sessione.kcalStimate !== null && ` · ~${sessione.kcalStimate} kcal (stima)`}
        </p>
      </section>

      <ul className="space-y-3">
        {sessione.esercizi.map((esercizio) => (
          <li key={esercizio.id} className="rounded-xl border border-slate-800 bg-slate-900 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-semibold">{esercizio.nome}</h2>
                <p className="text-sm text-slate-400">{esercizio.muscoli}</p>
              </div>
              <Link href={`/esercizi/${esercizio.id}`} className="shrink-0 text-sm text-blue-400 hover:underline">
                Andamento
              </Link>
            </div>

            <table className="mt-3 w-full text-sm">
              <thead className="text-left text-xs tracking-wide text-slate-500 uppercase">
                <tr>
                  <th className="pb-1 font-medium">Serie</th>
                  <th className="pb-1 font-medium">Kg</th>
                  <th className="pb-1 font-medium">Rip.</th>
                </tr>
              </thead>
              <tbody className="tabular-nums">
                {esercizio.serie.map((serie, indice) => (
                  <tr key={indice} className="border-t border-slate-800">
                    <td className="py-1.5 text-slate-500">{indice + 1}</td>
                    <td className="py-1.5">{serie.pesoKg === null ? '—' : formatNumero(serie.pesoKg)}</td>
                    <td className="py-1.5">{serie.ripetizioni}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </li>
        ))}
      </ul>
    </div>
  )
}
