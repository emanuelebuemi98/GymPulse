import type { Metadata } from 'next'
import { GraficoAndamento, type PuntoGrafico } from '@/components/GraficoAndamento'
import { SelettoreEsercizio } from '@/components/SelettoreEsercizio'
import { stileCarta } from '@/components/stili'
import { formatData, formatDataBreve, formatDataNumerica, formatNumero } from '@/lib/formato'
import { miglioreRM } from '@/lib/progressi'
import { andamentoEsercizio, eserciziConDati, recordPerEsercizio } from '@/lib/storico'
import { primoParametro } from '@/lib/url'

// Legge il database a ogni richiesta: i grafici si aggiornano dopo ogni seduta.
export const dynamic = 'force-dynamic'

export const metadata: Metadata = { title: 'Progressi' }

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> }

export default async function ProgressiPage({ searchParams }: Props) {
  const richiesto = primoParametro((await searchParams).e)
  const [esercizi, record] = await Promise.all([eserciziConDati(), recordPerEsercizio()])

  if (esercizi.length === 0) {
    return (
      <div className="space-y-5">
        <h1 className="text-3xl font-extrabold tracking-tight">Progressi</h1>
        <p className={`${stileCarta} p-4 text-muto`}>Registra almeno una seduta per vedere i grafici.</p>
      </div>
    )
  }

  const scelto = esercizi.find((e) => e.id === richiesto) ?? esercizi[0]
  const sedute = await andamentoEsercizio(scelto.id)
  const conCarico = sedute.some((s) => s.massimoKg !== null)
  const daVerificare = sedute.some((s) => s.datiIniziali)

  // Con i pesi si segue il carico massimo di ogni seduta; a corpo libero, le ripetizioni totali.
  const punti: PuntoGrafico[] = sedute.flatMap((seduta) => {
    const base = { x: seduta.data.getTime(), data: formatData(seduta.data), dataBreve: formatDataBreve(seduta.data) }
    if (conCarico) {
      if (seduta.massimoKg === null) return []
      return [{ ...base, y: seduta.massimoKg, valore: `${formatNumero(seduta.massimoKg)} kg` }]
    }
    const ripetizioni = seduta.serie.reduce((totale, s) => totale + s.ripetizioni, 0)
    return [{ ...base, y: ripetizioni, valore: `${ripetizioni} rip` }]
  })

  const rm = conCarico && !daVerificare ? miglioreRM(sedute.flatMap((s) => s.serie)) : null

  return (
    <div className="space-y-5">
      <h1 className="text-3xl font-extrabold tracking-tight">Progressi</h1>

      <SelettoreEsercizio esercizi={esercizi} scelto={scelto.id} />

      <section className={`${stileCarta} space-y-3 p-4`}>
        <div>
          <h2 className="text-lg font-extrabold">{conCarico ? 'Massimo kg per seduta' : 'Ripetizioni totali per seduta'}</h2>
          <p className="text-sm text-muto">
            {conCarico
              ? 'Kg più alto tra le serie di questo esercizio, seduta per seduta.'
              : 'Somma delle ripetizioni di questo esercizio, seduta per seduta.'}
          </p>
        </div>

        <GraficoAndamento punti={punti} titolo={`Andamento di ${scelto.nome}`} />

        <details className="text-sm text-muto">
          <summary className="cursor-pointer font-semibold hover:text-testo">Vedi come tabella</summary>
          <table className="mt-2 w-full tabular-nums">
            <thead className="text-left text-xs">
              <tr>
                <th className="pb-1 font-semibold">Data</th>
                <th className="pb-1 font-semibold">Valore</th>
              </tr>
            </thead>
            <tbody>
              {punti.map((punto) => (
                <tr key={punto.x} className="border-t border-bordo">
                  <td className="py-1.5">{punto.data}</td>
                  <td className="py-1.5 text-testo">{punto.valore}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </details>
      </section>

      {conCarico && (
        <section className={`${stileCarta} space-y-2 p-4`}>
          <h2 className="text-lg font-extrabold">Volume indicativo (kg × ripetizioni)</h2>
          <ul className="divide-y divide-bordo">
            {sedute
              .filter((s) => s.volumeKg > 0)
              .map((seduta) => (
                <li key={seduta.sessioneId} className="flex items-baseline justify-between py-2">
                  <span>{formatDataNumerica(seduta.data)}</span>
                  <span className={`font-semibold tabular-nums ${seduta.datiIniziali ? 'text-attenzione' : 'text-testo'}`}>
                    {formatNumero(seduta.volumeKg, 0)} kg{seduta.datiIniziali && ' *'}
                  </span>
                </li>
              ))}
          </ul>
          {daVerificare && <p className="text-xs text-attenzione">* basato su ripetizioni da verificare.</p>}
        </section>
      )}

      <p className="flex gap-2 text-sm text-muto">
        <span aria-hidden="true">ⓘ</span>
        <span>
          Ogni dato vale solo per lo stesso esercizio: i kg di macchine, cavi, manubri e bilanciere non sono
          confrontabili tra loro. Il volume è solo indicativo
          {rm !== null && `, e il massimale stimato (${formatNumero(rm)} kg, formula di Epley) non è una misura diretta`}.
        </span>
      </p>

      <section className={`${stileCarta} space-y-2 p-4`}>
        <h2 className="text-lg font-extrabold">Record kg per esercizio</h2>
        {record.length === 0 ? (
          <p className="text-sm text-muto">Nessun record: servono serie con un peso.</p>
        ) : (
          <ul className="divide-y divide-bordo">
            {record.map((voce) => (
              <li key={voce.esercizioId} className="flex items-baseline justify-between gap-3 py-2">
                <span className="min-w-0 font-semibold">{voce.nome}</span>
                <span className="shrink-0 tabular-nums">
                  <span className="font-extrabold text-accento">{formatNumero(voce.pesoKg)} kg</span>{' '}
                  <span className="text-sm text-muto">{formatDataNumerica(voce.data)}</span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
