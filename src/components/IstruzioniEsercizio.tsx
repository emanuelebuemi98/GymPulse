'use client'

import { useState } from 'react'
import { leggiDettaglio } from '@/app/esercizi/actions'
import type { DettaglioEsercizio } from '@/lib/tipi'

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
      <button
        type="button"
        onClick={alClick}
        aria-expanded={aperto}
        aria-label={`Come si fa: ${nome}`}
        className="text-sm font-semibold text-accento underline-offset-2 hover:underline"
      >
        {aperto ? 'Nascondi come si fa' : 'Come si fa'}
      </button>

      {aperto && (
        <div className="space-y-3 rounded-2xl bg-carta-alta p-3 text-sm">
          {inCorso && <p className="text-muto">Carico…</p>}
          {errore && <p className="text-errore">Non sono riuscito a leggere le istruzioni: riprova.</p>}

          {dettaglio && !vuoto && (
            <>
              {dettaglio.immagine && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={dettaglio.immagine} alt={`Esecuzione: ${nome}`} className="w-full max-w-xs rounded-xl" loading="lazy" />
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
