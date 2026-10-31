import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { EliminaSessione } from '@/components/EliminaSessione'
import { stileAvviso, stileCarta, stileEtichetta } from '@/components/stili'
import { formatData, formatDataLunga, formatNumero } from '@/lib/formato'
import { dettaglioSessione } from '@/lib/storico'
import { idDaParametro } from '@/lib/url'
import { richiediUtente, utenteCorrente } from '@/lib/accesso'

// Legge il database a ogni richiesta: il dettaglio viene dal database.
export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ sessioneId: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const userId = await utenteCorrente()
  if (!userId) return { title: 'Seduta' }
  const sessioneId = idDaParametro((await params).sessioneId)
  const sessione = sessioneId === null ? null : await dettaglioSessione(userId, sessioneId)
  return { title: sessione ? `Seduta del ${formatData(sessione.data)}` : 'Seduta non trovata' }
}

export default async function DettaglioSessionePage({ params }: Props) {
  const userId = await richiediUtente()
  const sessioneId = idDaParametro((await params).sessioneId)
  const sessione = sessioneId === null ? null : await dettaglioSessione(userId, sessioneId)
  if (!sessione) notFound()

  return (
    <div className="space-y-5">
      <header>
        <Link href="/storico" className="text-sm font-semibold text-accento">
          ← Storico
        </Link>
        <h1 className="mt-2 text-2xl font-extrabold tracking-tight">{formatDataLunga(sessione.data)}</h1>
        <p className="text-muto">
          Allenamento {sessione.giornoId} · {sessione.giornoTitolo}
          {sessione.durataMinuti !== null && ` · ${sessione.durataMinuti} min`}
        </p>
        {sessione.datiIniziali && (
          <div className="flex flex-wrap gap-2 pt-2">
            <span className={stileEtichetta}>Dati iniziali</span>
            <span className={stileAvviso}>Rep da verificare</span>
          </div>
        )}
      </header>

      {sessione.note && (
        <section className={`${stileCarta} p-4`}>
          <h2 className="text-sm font-semibold text-muto">Note</h2>
          <p className="mt-1 whitespace-pre-wrap">{sessione.note}</p>
        </section>
      )}

      <ul className="space-y-3">
        {sessione.esercizi.map((esercizio) => (
          <li key={esercizio.id} className={`${stileCarta} p-4`}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="text-lg font-extrabold leading-tight">{esercizio.nome}</h2>
                {esercizio.muscoli && <p className="text-sm text-muto">{esercizio.muscoli}</p>}
              </div>
              <Link href={`/progressi?e=${esercizio.id}`} className="shrink-0 text-sm font-semibold text-accento">
                Andamento
              </Link>
            </div>

            <table className="mt-3 w-full text-sm">
              <thead className="text-left text-xs text-muto">
                <tr>
                  <th className="pb-1 font-semibold">Serie</th>
                  <th className="pb-1 font-semibold">Kg</th>
                  <th className="pb-1 font-semibold">Rip.{sessione.datiIniziali && ' *'}</th>
                </tr>
              </thead>
              <tbody className="tabular-nums">
                {esercizio.serie.map((serie, indice) => (
                  <tr key={indice} className="border-t border-bordo">
                    <td className="py-2 text-muto">{indice + 1}</td>
                    <td className="py-2 font-semibold">{serie.pesoKg === null ? '—' : formatNumero(serie.pesoKg)}</td>
                    <td className="py-2">{serie.ripetizioni}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </li>
        ))}
      </ul>

      {sessione.datiIniziali && (
        <p className="text-xs text-muto">
          * Le ripetizioni di questa seduta non sono state registrate: sono il target della scheda, non un dato misurato.
        </p>
      )}

      <EliminaSessione id={sessione.id} />
    </div>
  )
}
