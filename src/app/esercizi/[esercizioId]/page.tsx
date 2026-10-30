import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { GraficoAndamento, type PuntoGrafico } from '@/components/GraficoAndamento'
import { formatData, formatNumero } from '@/lib/formato'
import { miglioreRM, trovaEsercizio } from '@/lib/progressi'
import { storicoEsercizio } from '@/lib/storico'

// Legge il database a ogni richiesta: il grafico si aggiorna dopo ogni allenamento.
export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ esercizioId: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { esercizioId } = await params
  const esercizio = trovaEsercizio(esercizioId)
  return { title: esercizio ? `Andamento: ${esercizio.nome}` : 'Esercizio non trovato' }
}

export default async function AndamentoEsercizioPage({ params }: Props) {
  const { esercizioId } = await params
  const esercizio = trovaEsercizio(esercizioId)
  if (!esercizio) notFound()

  const sessioni = await storicoEsercizio(esercizio.id)
  const conCarico = sessioni.some((s) => s.serie.some((serie) => serie.pesoKg !== null))

  // Con i pesi si segue il carico massimo di ogni allenamento; a corpo libero, le ripetizioni totali.
  const punti: PuntoGrafico[] = sessioni.flatMap((sessione) => {
    const data = formatData(sessione.data)
    if (conCarico) {
      const pesi = sessione.serie.flatMap((serie) => (serie.pesoKg === null ? [] : [serie.pesoKg]))
      if (pesi.length === 0) return []
      const massimo = Math.max(...pesi)
      return [{ x: sessione.data.getTime(), y: massimo, data, valore: `${formatNumero(massimo)} kg` }]
    }
    const ripetizioni = sessione.serie.reduce((totale, serie) => totale + serie.ripetizioni, 0)
    return [{ x: sessione.data.getTime(), y: ripetizioni, data, valore: `${ripetizioni} rip` }]
  })

  const rm = conCarico ? miglioreRM(sessioni.flatMap((sessione) => sessione.serie)) : null

  return (
    <div className="space-y-6">
      <section>
        <Link href="/storico" className="text-sm text-blue-400 hover:underline">
          ← Storico
        </Link>
        <h1 className="mt-2 text-2xl font-bold">{esercizio.nome}</h1>
        <p className="text-slate-400">{esercizio.muscoli}</p>
      </section>

      {punti.length === 0 ? (
        <p className="rounded-xl border border-slate-800 bg-slate-900 p-4 text-slate-400">
          Nessuna serie registrata per questo esercizio.
        </p>
      ) : (
        <>
          <section className="space-y-3 rounded-xl border border-slate-800 bg-slate-900 p-4">
            <div className="flex items-baseline justify-between gap-3">
              <h2 className="font-semibold">{conCarico ? 'Carico massimo per allenamento' : 'Ripetizioni totali per allenamento'}</h2>
              {rm !== null && (
                <p className="text-sm text-slate-400">
                  Massimale stimato: <span className="font-semibold text-slate-100">{formatNumero(rm)} kg</span>
                </p>
              )}
            </div>

            <GraficoAndamento punti={punti} titolo={`Andamento di ${esercizio.nome}`} />

            <details className="text-sm text-slate-400">
              <summary className="cursor-pointer hover:text-slate-200">Vedi come tabella</summary>
              <table className="mt-2 w-full tabular-nums">
                <thead className="text-left text-xs tracking-wide text-slate-500 uppercase">
                  <tr>
                    <th className="pb-1 font-medium">Data</th>
                    <th className="pb-1 font-medium">Valore</th>
                  </tr>
                </thead>
                <tbody>
                  {punti.map((punto) => (
                    <tr key={`${punto.x}`} className="border-t border-slate-800">
                      <td className="py-1.5">{punto.data}</td>
                      <td className="py-1.5">{punto.valore}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </details>
          </section>

          {rm !== null && (
            <p className="text-xs text-slate-500">
              Il massimale è una stima con la formula di Epley (peso × (1 + ripetizioni / 30)), non una misura diretta.
            </p>
          )}
        </>
      )}
    </div>
  )
}
