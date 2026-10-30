import type { ReactNode } from 'react'
import type { Esercizio } from '../data/scheda'
import { descrizioneObiettivo, formatRecupero } from '../lib/allenamento'

export function ExerciseCard({ esercizio, children }: { esercizio: Esercizio; children?: ReactNode }) {
  const { obiettivo } = esercizio

  return (
    <li className="rounded-xl border border-slate-800 bg-slate-900 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-semibold">{esercizio.nome}</h2>
          <p className="text-sm text-slate-400">{esercizio.muscoli}</p>
        </div>
        <p className="shrink-0 font-mono text-sm font-semibold text-blue-400">
          {descrizioneObiettivo(obiettivo)}
        </p>
      </div>
      {(obiettivo.tipo === 'serie' || esercizio.nota) && (
        <ul className="mt-3 space-y-1 text-sm text-slate-400">
          {obiettivo.tipo === 'serie' && <li>Recupero: {formatRecupero(obiettivo.recuperoSec)}</li>}
          {esercizio.nota && <li>{esercizio.nota}</li>}
        </ul>
      )}
      {children}
    </li>
  )
}
