'use client'

import { useMemo, useState } from 'react'
import { leggiDettaglio } from '@/app/esercizi/actions'
import type { VoceCatalogo } from '@/lib/catalogo-db'
import { CATEGORIE, type Categoria } from '@/lib/categorie'
import type { DettaglioEsercizio } from '@/lib/tipi'
import { DettaglioEsercizioVista } from './DettaglioEsercizio'
import { IconaChevronGiu } from './icone'
import { ImmagineEsercizio } from './ImmagineEsercizio'
import { stileCarta, stileTesto } from './stili'

const senzaAccenti = (testo: string) => testo.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase()

// Il catalogo intero, diviso per categoria: si cerca per nome, si sceglie la categoria con le linguette e si tocca un esercizio per
// vedere come si fa. È solo da consultare: gli esercizi si aggiungono alla scheda dalla pagina Personalizza.
export function CatalogoCompleto({ voci }: { voci: VoceCatalogo[] }) {
  const [testo, setTesto] = useState('')
  const [categoria, setCategoria] = useState<Categoria | ''>('')
  const [aperto, setAperto] = useState<number | null>(null)
  const [dettagli, setDettagli] = useState<Record<number, DettaglioEsercizio>>({})
  const [inCorso, setInCorso] = useState<number | null>(null)
  const [errore, setErrore] = useState<number | null>(null)

  const cerca = senzaAccenti(testo.trim())
  const trovate = useMemo(
    () => voci.filter((voce) => cerca === '' || [voce.nome, voce.nomeEn].some((campo) => senzaAccenti(campo).includes(cerca))),
    [voci, cerca],
  )
  // Quanti esercizi per categoria, tenendo conto della ricerca: le linguette dicono dove si trova quello che si cerca.
  const conteggi = useMemo(() => {
    const mappa = new Map<string, number>()
    for (const voce of trovate) mappa.set(voce.categoria, (mappa.get(voce.categoria) ?? 0) + 1)
    return mappa
  }, [trovate])

  const sezioni = CATEGORIE.map((voce) => ({
    ...voce,
    esercizi: trovate.filter((esercizio) => esercizio.categoria === voce.chiave),
  })).filter((sezione) => sezione.esercizi.length > 0 && (categoria === '' || sezione.chiave === categoria))

  async function tocca(id: number) {
    const apriOra = aperto !== id
    setAperto(apriOra ? id : null)
    if (!apriOra || dettagli[id] || inCorso !== null) return
    setInCorso(id)
    setErrore(null)
    try {
      const letto = await leggiDettaglio(id, null)
      setDettagli((prec) => ({ ...prec, [id]: letto }))
    } catch {
      setErrore(id)
    } finally {
      setInCorso(null)
    }
  }

  return (
    <div className="space-y-4">
      <input
        type="search"
        value={testo}
        onChange={(e) => setTesto(e.target.value)}
        placeholder="Cerca un esercizio"
        aria-label="Cerca un esercizio per nome"
        className={`${stileTesto} text-left`}
      />

      {/* Le categorie come linguette che scorrono di lato: sul telefono ce ne stanno quattro alla volta. */}
      <div role="group" aria-label="Categoria" className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
        <Linguetta attiva={categoria === ''} alTocco={() => setCategoria('')} etichetta="Tutte" numero={trovate.length} />
        {CATEGORIE.map((voce) => (
          <Linguetta
            key={voce.chiave}
            attiva={categoria === voce.chiave}
            alTocco={() => setCategoria(voce.chiave)}
            etichetta={voce.etichetta}
            numero={conteggi.get(voce.chiave) ?? 0}
          />
        ))}
      </div>

      {sezioni.length === 0 && <p className={`${stileCarta} p-4 text-muto`}>Nessun esercizio trovato.</p>}

      {sezioni.map((sezione) => (
        <section key={sezione.chiave} aria-labelledby={`cat-${sezione.chiave}`} className="space-y-2">
          <h2 id={`cat-${sezione.chiave}`} className="flex items-baseline justify-between text-lg font-extrabold">
            {sezione.etichetta}
            <span className="text-sm font-semibold text-muto">{sezione.esercizi.length}</span>
          </h2>
          <ul className={`${stileCarta} divide-y divide-bordo overflow-hidden`}>
            {sezione.esercizi.map((voce) => {
              const èAperto = aperto === voce.id
              return (
                <li key={voce.id}>
                  <button
                    type="button"
                    onClick={() => tocca(voce.id)}
                    aria-expanded={èAperto}
                    className="flex w-full items-center gap-3 px-3 py-2.5 text-left active:bg-carta-alta"
                  >
                    <span className="grid size-16 shrink-0 place-items-center overflow-hidden rounded-xl bg-carta-alta">
                      <ImmagineEsercizio src={voce.immagine} nome={voce.nome} className="size-16 !border-0" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-semibold leading-tight">{voce.nome}</span>
                      <span className="block text-xs text-muto">{voce.nomeEn}</span>
                      <span className="block text-xs text-muto">
                        {[voce.attrezzatura, voce.muscolo].filter(Boolean).join(' · ')}
                      </span>
                    </span>
                    <IconaChevronGiu
                      className={`size-5 shrink-0 text-muto transition-transform motion-reduce:transition-none ${èAperto ? 'rotate-180' : ''}`}
                    />
                  </button>
                  {èAperto && (
                    <div className="px-3 pb-3">
                      <DettaglioEsercizioVista
                        nome={voce.nome}
                        dettaglio={dettagli[voce.id] ?? null}
                        inCorso={inCorso === voce.id}
                        errore={errore === voce.id}
                      />
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
        </section>
      ))}
    </div>
  )
}

function Linguetta(props: { attiva: boolean; alTocco: () => void; etichetta: string; numero: number }) {
  return (
    <button
      type="button"
      onClick={props.alTocco}
      aria-pressed={props.attiva}
      className={`shrink-0 rounded-full border px-4 py-2.5 text-sm font-semibold transition active:opacity-80 ${
        props.attiva ? 'border-accento bg-accento text-su-accento' : 'border-bordo bg-carta text-testo'
      }`}
    >
      {props.etichetta} <span className={props.attiva ? 'opacity-80' : 'text-muto'}>{props.numero}</span>
    </button>
  )
}
