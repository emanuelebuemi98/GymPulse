'use client'

import { useMemo, useState } from 'react'
import { CATEGORIE, etichettaCategoria, categoriaDa, type Categoria } from '@/lib/categorie'
import type { VoceElenco } from '@/lib/tipi'
import { IconaPiu } from './icone'
import { stileTesto } from './stili'

type Props = {
  elenco: VoceElenco[]
  // Gli esercizi già nella scheda o nella sessione: non si propongono di nuovo. 'e12' per uno della persona, 'c34' per
  // uno del catalogo.
  esclusi: Set<string>
  alScelto: (voce: VoceElenco) => void
}

// Quanti risultati mostrare alla volta: l'elenco ha centinaia di righe e sul telefono non si scorre tutto.
const RISULTATI_MASSIMI = 40

const senzaAccenti = (testo: string) => testo.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase()

// Scelta di un esercizio dall'elenco: si cerca per nome (italiano o inglese) e si filtra per categoria. Il nome italiano è
// quello in evidenza, l'inglese sta sotto, più piccolo.
export function ElencoEsercizi({ elenco, esclusi, alScelto }: Props) {
  const [testo, setTesto] = useState('')
  const [categoria, setCategoria] = useState<Categoria | ''>('')

  const risultati = useMemo(() => {
    const cerca = senzaAccenti(testo.trim())
    return elenco.filter((voce) => {
      if (esclusi.has(voce.chiave)) return false
      if (categoria !== '' && voce.categoria !== categoria) return false
      if (cerca === '') return true
      return [voce.nome, voce.nomeEn, voce.alias].some((campo) => senzaAccenti(campo).includes(cerca))
    })
  }, [elenco, esclusi, testo, categoria])

  const mostrati = risultati.slice(0, RISULTATI_MASSIMI)

  return (
    <div className="space-y-3">
      <input
        type="search"
        value={testo}
        onChange={(e) => setTesto(e.target.value)}
        placeholder="Cerca un esercizio"
        aria-label="Cerca un esercizio per nome"
        className={`${stileTesto} text-left`}
      />

      <select
        value={categoria}
        onChange={(e) => setCategoria(categoriaDa(e.target.value) ?? '')}
        aria-label="Filtra per categoria"
        className={`${stileTesto} text-left`}
      >
        <option value="">Tutte le categorie</option>
        {CATEGORIE.map((voce) => (
          <option key={voce.chiave} value={voce.chiave}>
            {voce.etichetta}
          </option>
        ))}
      </select>

      <p className="text-xs text-muto" aria-live="polite">
        {risultati.length === 0
          ? 'Nessun esercizio trovato.'
          : risultati.length > mostrati.length
            ? `${mostrati.length} di ${risultati.length}: scrivi più lettere per restringere.`
            : `${risultati.length} ${risultati.length === 1 ? 'esercizio' : 'esercizi'}`}
      </p>

      <ul className="max-h-80 divide-y divide-bordo overflow-y-auto rounded-2xl border border-bordo">
        {mostrati.map((voce) => {
          const cat = categoriaDa(voce.categoria)
          return (
            <li key={voce.chiave}>
              <button
                type="button"
                onClick={() => alScelto(voce)}
                className="flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left active:bg-carta-alta"
              >
                <span className="min-w-0">
                  <span className="block font-semibold leading-tight">{voce.nome}</span>
                  {voce.nomeEn !== '' && <span className="block text-xs text-muto">{voce.nomeEn}</span>}
                </span>
                <span className="flex shrink-0 items-center gap-2">
                  {cat && (
                    <span className="rounded-full bg-carta-alta px-2 py-0.5 text-xs font-semibold text-muto">
                      {etichettaCategoria(cat)}
                    </span>
                  )}
                  <IconaPiu className="size-4 text-muto" />
                </span>
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
