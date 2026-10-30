import Link from 'next/link'
import { giorni } from '@/data/scheda'
import { indiceGiornoSuccessivo } from '@/lib/allenamento'
import { ultimoGiornoRegistrato } from '@/lib/sessioni'

// Legge il database a ogni richiesta: il giorno suggerito cambia dopo ogni allenamento.
export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const ultimoId = await ultimoGiornoRegistrato()
  const ultimoIndice = ultimoId === null ? -1 : giorni.findIndex((giorno) => giorno.id === ultimoId)
  const prossimo = giorni[indiceGiornoSuccessivo(ultimoIndice === -1 ? null : ultimoIndice, giorni.length)]

  return (
    <div className="space-y-8">
      <section className="rounded-xl bg-blue-600 p-5">
        <p className="text-sm text-blue-100">Prossimo allenamento</p>
        <h1 className="mt-1 text-2xl font-bold">
          Giorno {prossimo.numero}: {prossimo.titolo}
        </h1>
        <Link
          href={`/giorni/${prossimo.id}`}
          className="mt-4 inline-block rounded-lg bg-white px-4 py-2 font-semibold text-blue-700"
        >
          Apri la scheda
        </Link>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold">La tua scheda</h2>
        <ul className="space-y-2">
          {giorni.map((giorno) => (
            <li key={giorno.id}>
              <Link
                href={`/giorni/${giorno.id}`}
                className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900 p-4 hover:border-slate-700"
              >
                <span>
                  <span className="block text-sm text-slate-400">Giorno {giorno.numero}</span>
                  <span className="font-semibold">{giorno.titolo}</span>
                </span>
                <span className="text-sm text-slate-400">{giorno.esercizi.length} esercizi</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
