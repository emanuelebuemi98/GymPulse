'use client'

import { useState } from 'react'
import { leggiDettaglio } from '@/app/esercizi/actions'
import type { DettaglioEsercizio } from '@/lib/tipi'
import { IconaChevronGiu } from './icone'
import { ImmagineEsercizio } from './ImmagineEsercizio'
import { OminoDomanda } from './OminoDomanda'

type Props = {
  // Per un esercizio del catalogo non ancora della persona si passa catalogoId; per uno suo, l'id.
  catalogoId: number | null
  esercizioId: number | null
  nome: string
}

// "Come si fa": si apre con un tocco e legge dal database come si esegue l'esercizio, le accortezze e la foto. Il testo non
// viaggia con la pagina: si chiede al server solo quando serve, una volta sola per apertura. Per un esercizio personale non
// c'è niente da mostrare e il pulsante non compare.
export function IstruzioniEsercizio({ catalogoId, esercizioId, nome }: Props) {
  const [aperto, setAperto] = useState(false)
  const [dettaglio, setDettaglio] = useState<DettaglioEsercizio | null>(null)
  const [errore, setErrore] = useState(false)
  const [inCorso, setInCorso] = useState(false)

  async function alClick() {
    const apriOra = !aperto
    setAperto(apriOra)
    if (!apriOra || dettaglio !== null || inCorso) return
    setInCorso(true)
    setErrore(false)
    try {
      setDettaglio(await leggiDettaglio(catalogoId, esercizioId))
    } catch {
      setErrore(true)
    } finally {
      setInCorso(false)
    }
  }

  const vuoto = dettaglio !== null && dettaglio.esecuzione.length === 0 && dettaglio.accortezze.length === 0

  return (
    <div className="space-y-2">
      {/* Un vero pulsante, con l'omino che si chiede come si fa e la freccia che dice che si apre e si chiude. */}
      <button
        type="button"
        onClick={alClick}
        aria-expanded={aperto}
        aria-label={`Come si fa: ${nome}`}
        className="flex w-full items-center gap-3 rounded-2xl border border-bordo bg-carta-alta py-1.5 pr-3 pl-2 text-left transition active:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accento"
      >
        <OminoDomanda className="h-11 w-auto shrink-0" />
        <span className="min-w-0 flex-1">
          <span className="block font-extrabold">{aperto ? 'Nascondi come si fa' : 'Come si fa'}</span>
          <span className="block text-xs text-muto">Immagine, passi e accortezze</span>
        </span>
        <IconaChevronGiu className={`size-5 shrink-0 text-muto transition-transform motion-reduce:transition-none ${aperto ? 'rotate-180' : ''}`} />
      </button>

      {aperto && (
        <div className="space-y-3 rounded-2xl bg-carta-alta p-3 text-sm">
          {inCorso && <p className="text-muto">Carico…</p>}
          {errore && <p className="text-errore">Non sono riuscito a leggere le istruzioni: riprova.</p>}

          {dettaglio && !vuoto && (
            <>
              {dettaglio.immagine && (
                <ImmagineEsercizio src={dettaglio.immagine} nome={nome} className="aspect-square w-full max-w-[200px]" />
              )}
              <p className="text-xs text-muto">
                {[dettaglio.attrezzatura, dettaglio.muscoloPrincipale && `muscoli: ${dettaglio.muscoloPrincipale}`]
                  .filter(Boolean)
                  .join(' · ')}
                {dettaglio.muscoliSecondari && ` (secondari: ${dettaglio.muscoliSecondari})`}
              </p>

              {dettaglio.esecuzione.length > 0 && (
                <section className="space-y-1">
                  <h4 className="font-bold">Come si esegue</h4>
                  <ol className="list-decimal space-y-1 pl-5">
                    {dettaglio.esecuzione.map((passo, i) => (
                      <li key={i}>{passo}</li>
                    ))}
                  </ol>
                </section>
              )}

              {dettaglio.accortezze.length > 0 && (
                <section className="space-y-1">
                  <h4 className="font-bold">Accortezze</h4>
                  <ul className="list-disc space-y-1 pl-5">
                    {dettaglio.accortezze.map((a, i) => (
                      <li key={i}>{a}</li>
                    ))}
                  </ul>
                </section>
              )}
            </>
          )}

          {vuoto && <p className="text-muto">Per questo esercizio non c&apos;è ancora una descrizione.</p>}
        </div>
      )}
    </div>
  )
}
