import type { GiornataConteggio } from '@/lib/panoramica'

// Quante sedute per ogni giornata della scheda. Sono poche parti da confrontare, quindi barre orizzontali di un
// solo colore: la lunghezza è il dato e il numero sta accanto, senza bisogno di tooltip. Le giornate restano
// nell'ordine A, B, C della rotazione e non in ordine di grandezza.
export function DistribuzioneGiornate({ giornate }: { giornate: GiornataConteggio[] }) {
  const totale = giornate.reduce((somma, giornata) => somma + giornata.sedute, 0)
  const massimo = Math.max(1, ...giornate.map((giornata) => giornata.sedute))

  return (
    <ul className="space-y-3">
      {giornate.map((giornata) => (
        <li key={giornata.id}>
          <div className="flex items-baseline justify-between gap-3">
            <span className="min-w-0 font-semibold">
              {giornata.id} · {giornata.titolo}
            </span>
            <span className="shrink-0 text-sm tabular-nums">
              <span className="font-extrabold text-testo">{giornata.sedute}</span>{' '}
              <span className="text-muto">{Math.round((giornata.sedute / totale) * 100)}%</span>
            </span>
          </div>
          <div aria-hidden="true" className="mt-1.5">
            <div
              className="h-3 rounded-r bg-grafico"
              style={{ width: `${(giornata.sedute / massimo) * 100}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  )
}
