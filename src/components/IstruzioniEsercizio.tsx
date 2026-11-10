'use client'

import { useState } from 'react'
import { leggiDettaglio } from '@/app/esercizi/actions'
import type { DettaglioEsercizio } from '@/lib/tipi'
import { DettaglioEsercizioVista } from './DettaglioEsercizio'
import { IconaChevronGiu } from './icone'
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

      {aperto && <DettaglioEsercizioVista nome={nome} dettaglio={dettaglio} inCorso={inCorso} errore={errore} />}
    </div>
  )
}
