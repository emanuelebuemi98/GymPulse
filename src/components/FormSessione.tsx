'use client'

import { useState, useTransition, type FormEvent, type ReactNode } from 'react'
import { salvaSessione } from '@/app/actions'
import { ExerciseCard } from '@/components/ExerciseCard'
import type { Esercizio, Giorno, Obiettivo } from '@/data/scheda'
import { stimaKcal } from '@/lib/allenamento'
import { formatNumero } from '@/lib/formato'
import { parseIntero, parseNumero, type UltimaSessione } from '@/lib/sessione-schema'
import type { SuggerimentoCarico } from '@/lib/progressi'

type RigaSerie = { pesoKg: string; ripetizioni: string }

type Props = {
  giorno: Giorno
  ultima: UltimaSessione | null
  suggerimenti: Record<string, SuggerimentoCarico>
}

function testoSuggerimento(suggerimento: SuggerimentoCarico): string {
  return suggerimento.aumenta
    ? `Prossimo carico: ${formatNumero(suggerimento.kg)} kg`
    : `Resta a ${formatNumero(suggerimento.kg)} kg: completa ${suggerimento.ripMax} rip in ogni serie per salire`
}

const classeInput =
  'w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-center font-mono text-slate-100 placeholder:text-slate-600 focus:border-blue-500 focus:outline-none'

const rigaVuota = (): RigaSerie => ({ pesoKg: '', ripetizioni: '' })

function serieIniziali(obiettivo: Obiettivo): number {
  switch (obiettivo.tipo) {
    case 'serie':
      return obiettivo.serie
    case 'libero':
      return obiettivo.serieMin
    case 'totale':
      return 1
  }
}

function placeholderRipetizioni(obiettivo: Obiettivo): string {
  if (obiettivo.tipo !== 'serie') return 'rip'
  return obiettivo.ripMin === obiettivo.ripMax
    ? String(obiettivo.ripMin)
    : `${obiettivo.ripMin}-${obiettivo.ripMax}`
}

// Se c'è un allenamento precedente dello stesso giorno, ne riprende i valori.
function righeIniziali(esercizio: Esercizio, ultima: UltimaSessione | null): RigaSerie[] {
  const precedenti = ultima?.serie[esercizio.id] ?? []
  if (precedenti.length > 0) {
    return precedenti.map((serie) => ({
      pesoKg: serie.pesoKg === null ? '' : String(serie.pesoKg),
      ripetizioni: String(serie.ripetizioni),
    }))
  }
  return Array.from({ length: serieIniziali(esercizio.obiettivo) }, rigaVuota)
}

export function FormSessione({ giorno, ultima, suggerimenti }: Props) {
  const tutti = [...giorno.esercizi, giorno.addome]

  const [righe, setRighe] = useState<Record<string, RigaSerie[]>>(() =>
    Object.fromEntries(tutti.map((esercizio) => [esercizio.id, righeIniziali(esercizio, ultima)])),
  )
  const [durata, setDurata] = useState('')
  const [pesoCorporeo, setPesoCorporeo] = useState(String(ultima?.pesoCorporeoKg ?? ''))
  const [errore, setErrore] = useState<string | null>(null)
  const [inCorso, startTransition] = useTransition()

  const durataMinuti = parseIntero(durata)
  const pesoCorporeoKg = parseNumero(pesoCorporeo)
  const kcalStimate =
    durataMinuti !== null && pesoCorporeoKg !== null ? stimaKcal(pesoCorporeoKg, durataMinuti) : null

  function aggiornaRiga(esercizioId: string, indice: number, campo: keyof RigaSerie, valore: string) {
    setRighe((prec) => ({
      ...prec,
      [esercizioId]: prec[esercizioId].map((riga, i) => (i === indice ? { ...riga, [campo]: valore } : riga)),
    }))
  }

  function aggiungiRiga(esercizioId: string) {
    setRighe((prec) => ({ ...prec, [esercizioId]: [...prec[esercizioId], rigaVuota()] }))
  }

  function rimuoviRiga(esercizioId: string, indice: number) {
    setRighe((prec) => ({
      ...prec,
      [esercizioId]: prec[esercizioId].filter((_, i) => i !== indice),
    }))
  }

  function invia(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    setErrore(null)

    if (durata.trim() !== '' && durataMinuti === null) {
      setErrore('La durata deve essere un numero intero di minuti')
      return
    }
    if (pesoCorporeo.trim() !== '' && pesoCorporeoKg === null) {
      setErrore('Il peso corporeo non è valido')
      return
    }

    const esercizi: { esercizioId: string; serie: { pesoKg: number | null; ripetizioni: number | null }[] }[] = []
    for (const esercizio of tutti) {
      const serie: { pesoKg: number | null; ripetizioni: number | null }[] = []
      for (const [indice, riga] of righe[esercizio.id].entries()) {
        // Le righe completamente vuote vengono ignorate: non sono state fatte.
        if (riga.pesoKg.trim() === '' && riga.ripetizioni.trim() === '') continue

        const etichetta = `${esercizio.nome}, serie ${indice + 1}`
        const pesoKg = parseNumero(riga.pesoKg)
        const ripetizioni = parseIntero(riga.ripetizioni)
        if (riga.pesoKg.trim() !== '' && pesoKg === null) {
          setErrore(`Peso non valido: ${etichetta}`)
          return
        }
        if (ripetizioni === null) {
          setErrore(`Ripetizioni mancanti o non valide: ${etichetta}`)
          return
        }
        serie.push({ pesoKg, ripetizioni })
      }
      esercizi.push({ esercizioId: esercizio.id, serie })
    }

    startTransition(async () => {
      const esito = await salvaSessione({
        giornoId: giorno.id,
        durataMinuti,
        pesoCorporeoKg,
        esercizi,
      })
      if (esito.errore) setErrore(esito.errore)
    })
  }

  return (
    <form onSubmit={invia} className="space-y-6">
      <ul className="space-y-3">
        {tutti.map((esercizio) => (
          <ExerciseCard key={esercizio.id} esercizio={esercizio}>
            <div className="mt-4 space-y-2">
              {suggerimenti[esercizio.id] && (
                <p className="text-sm text-blue-300">{testoSuggerimento(suggerimenti[esercizio.id])}</p>
              )}

              <div className="grid grid-cols-[2rem_1fr_1fr_2.5rem] gap-2 text-xs tracking-wide text-slate-500 uppercase">
                <span>Serie</span>
                <span>Kg</span>
                <span>Rip.</span>
                <span />
              </div>

              {righe[esercizio.id].map((riga, indice) => (
                <div key={indice} className="grid grid-cols-[2rem_1fr_1fr_2.5rem] items-center gap-2">
                  <span className="text-sm text-slate-500">{indice + 1}</span>
                  <input
                    aria-label={`${esercizio.nome}, serie ${indice + 1}: peso in kg`}
                    inputMode="decimal"
                    placeholder="kg"
                    value={riga.pesoKg}
                    onChange={(e) => aggiornaRiga(esercizio.id, indice, 'pesoKg', e.target.value)}
                    className={classeInput}
                  />
                  <input
                    aria-label={`${esercizio.nome}, serie ${indice + 1}: ripetizioni`}
                    inputMode="numeric"
                    placeholder={placeholderRipetizioni(esercizio.obiettivo)}
                    value={riga.ripetizioni}
                    onChange={(e) => aggiornaRiga(esercizio.id, indice, 'ripetizioni', e.target.value)}
                    className={classeInput}
                  />
                  <button
                    type="button"
                    aria-label={`Rimuovi serie ${indice + 1} di ${esercizio.nome}`}
                    onClick={() => rimuoviRiga(esercizio.id, indice)}
                    className="h-10 rounded-lg text-lg text-slate-500 hover:bg-slate-800 hover:text-slate-200"
                  >
                    ×
                  </button>
                </div>
              ))}

              <button
                type="button"
                onClick={() => aggiungiRiga(esercizio.id)}
                className="text-sm font-medium text-blue-400 hover:text-blue-300"
              >
                + Aggiungi serie
              </button>
            </div>
          </ExerciseCard>
        ))}
      </ul>

      <section className="space-y-4 rounded-xl border border-slate-800 bg-slate-900 p-4">
        <h2 className="font-semibold">Dati della sessione</h2>
        <div className="grid grid-cols-2 gap-3">
          <Campo etichetta="Durata (minuti)">
            <input
              inputMode="numeric"
              placeholder="60"
              value={durata}
              onChange={(e) => setDurata(e.target.value)}
              className={classeInput}
            />
          </Campo>
          <Campo etichetta="Peso corporeo (kg)">
            <input
              inputMode="decimal"
              placeholder="80"
              value={pesoCorporeo}
              onChange={(e) => setPesoCorporeo(e.target.value)}
              className={classeInput}
            />
          </Campo>
        </div>

        {kcalStimate !== null && (
          <p className="text-sm text-slate-400">Stima indicativa: circa {kcalStimate} kcal</p>
        )}

        {errore && (
          <p role="alert" className="rounded-lg bg-red-950 p-3 text-sm text-red-300">
            {errore}
          </p>
        )}

        <button
          type="submit"
          disabled={inCorso}
          className="w-full rounded-lg bg-blue-600 py-3 font-semibold hover:bg-blue-500 disabled:opacity-50"
        >
          {inCorso ? 'Salvataggio…' : 'Salva allenamento'}
        </button>
      </section>
    </form>
  )
}

function Campo({ etichetta, children }: { etichetta: string; children: ReactNode }) {
  return (
    <label className="block space-y-1 text-sm text-slate-400">
      <span>{etichetta}</span>
      {children}
    </label>
  )
}
