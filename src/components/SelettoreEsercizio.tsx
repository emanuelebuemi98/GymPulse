'use client'

import { useRouter } from 'next/navigation'
import { stileTesto } from './stili'

type Props = {
  esercizi: { id: string; nome: string }[]
  scelto: string
}

export function SelettoreEsercizio({ esercizi, scelto }: Props) {
  const router = useRouter()

  return (
    <label className="block space-y-1 text-sm text-muto">
      <span>Esercizio</span>
      <select
        value={scelto}
        onChange={(e) => router.push(`/progressi?e=${encodeURIComponent(e.target.value)}`)}
        className={`${stileTesto} text-left`}
      >
        {esercizi.map((esercizio) => (
          <option key={esercizio.id} value={esercizio.id}>
            {esercizio.nome}
          </option>
        ))}
      </select>
    </label>
  )
}
