import { descrizioneObiettivo, descrizioneRecupero, formatRecupero } from '@/lib/allenamento'
import { formatNumero } from '@/lib/formato'
import { bloccoDi, nomeGruppo } from '@/lib/gruppi'
import type { Esercizio } from '@/lib/scheda-tipi'
import { ImmagineEsercizio } from './ImmagineEsercizio'
import { stileCarta } from './stili'

// Gli esercizi di una giornata: numero, foto, nome, obiettivo e recupero. `kg` (esercizio → ultimo carico) è facoltativo e lo passa
// solo la persona proprietaria della scheda: un personal trainer non lo riceve, quindi l'elenco non può mostrare nessun carico.
// Gli esercizi di una super serie (superset, triset, gigantset) sono vicini, con una barra a sinistra e il loro nome: al posto del
// numero hanno «1/2», «2/2», e il recupero è quello del gruppo, dopo l'ultimo esercizio.
export function ElencoGiornata({ esercizi, kg }: { esercizi: Esercizio[]; kg?: Record<number, number | null> }) {
  const voci = esercizi.map((esercizio) => ({ gruppo: esercizio.gruppo?.numero ?? null }))
  return (
    <ol className={`${stileCarta} divide-y divide-bordo overflow-hidden`}>
      {esercizi.map((esercizio, indice) => {
        const carico = kg?.[esercizio.id] ?? null
        const blocco = bloccoDi(voci, indice)
        const posizione = blocco ? indice - blocco.da : 0
        const èUltimo = blocco !== null && posizione === blocco.quanti - 1
        const recupero = blocco ? null : descrizioneRecupero(esercizio.obiettivo)
        return (
          <li
            key={esercizio.id}
            className={`flex items-center gap-3 py-3.5 pr-4 ${blocco ? 'border-l-4 border-l-accento pl-3' : 'pl-4'}`}
            aria-label={blocco ? `${nomeGruppo(blocco.quanti)} ${posizione + 1} di ${blocco.quanti}: ${esercizio.nome}` : undefined}
          >
            <span className="w-8 shrink-0 text-sm font-bold text-muto tabular-nums">
              {blocco ? `${posizione + 1}/${blocco.quanti}` : indice + 1}
            </span>
            <ImmagineEsercizio src={esercizio.immagine} nome={esercizio.nome} className="size-20" />
            <span className="min-w-0 flex-1">
              {blocco && posizione === 0 && (
                <span className="mb-1 inline-block rounded-full bg-accento/15 px-2.5 py-0.5 text-xs font-extrabold whitespace-nowrap text-accento">
                  {nomeGruppo(blocco.quanti)}
                </span>
              )}
              <span className="block font-bold">{esercizio.nome}</span>
              {esercizio.nomeEn && <span className="block text-xs text-muto">{esercizio.nomeEn}</span>}
              <span className="block text-sm text-muto">
                {descrizioneObiettivo(esercizio.obiettivo)}
                {recupero && ` · ${recupero}`}
              </span>
              {blocco && èUltimo && esercizio.gruppo && (
                <span className="mt-0.5 block text-xs font-semibold text-accento">
                  {esercizio.gruppo.recuperoSec > 0 ? `Poi recupero ${formatRecupero(esercizio.gruppo.recuperoSec)}` : 'Poi si riparte subito'}
                </span>
              )}
              {esercizio.nota && <span className="mt-0.5 block text-xs text-muto">{esercizio.nota}</span>}
            </span>
            {carico !== null && (
              <span className="shrink-0 rounded-full bg-carta-alta px-3 py-1 text-sm font-bold tabular-nums">
                {formatNumero(carico)} kg
              </span>
            )}
          </li>
        )
      })}
    </ol>
  )
}
