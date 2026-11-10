import { descrizioneObiettivo, descrizioneRecupero } from '@/lib/allenamento'
import { formatNumero } from '@/lib/formato'
import type { Esercizio } from '@/lib/scheda-tipi'
import { ImmagineEsercizio } from './ImmagineEsercizio'
import { stileCarta } from './stili'

// Gli esercizi di una giornata: numero, foto, nome, obiettivo e recupero. `kg` (esercizio → ultimo carico) è facoltativo e lo passa
// solo la persona proprietaria della scheda: un personal trainer non lo riceve, quindi l'elenco non può mostrare nessun carico.
export function ElencoGiornata({ esercizi, kg }: { esercizi: Esercizio[]; kg?: Record<number, number | null> }) {
  return (
    <ol className={`${stileCarta} divide-y divide-bordo overflow-hidden`}>
      {esercizi.map((esercizio, indice) => {
        const carico = kg?.[esercizio.id] ?? null
        const recupero = descrizioneRecupero(esercizio.obiettivo)
        return (
          <li key={esercizio.id} className="flex items-center gap-3 px-4 py-3.5">
            <span className="w-6 shrink-0 text-sm font-bold text-muto tabular-nums">{indice + 1}</span>
            <ImmagineEsercizio src={esercizio.immagine} nome={esercizio.nome} className="size-20" />
            <span className="min-w-0 flex-1">
              <span className="block font-bold">{esercizio.nome}</span>
              {esercizio.nomeEn && <span className="block text-xs text-muto">{esercizio.nomeEn}</span>}
              <span className="block text-sm text-muto">
                {descrizioneObiettivo(esercizio.obiettivo)}
                {recupero && ` · ${recupero}`}
              </span>
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
