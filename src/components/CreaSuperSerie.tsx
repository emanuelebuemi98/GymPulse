'use client'

import { useState } from 'react'
import { GRUPPO_MAX, GRUPPO_MIN, nomeGruppo } from '@/lib/gruppi'
import { parseIntero } from '@/lib/numeri'
import type { VoceForm } from '@/lib/scheda-form'
import { RECUPERO_PREDEFINITO } from '@/lib/voci'
import { stileBottoneChiaro, stileCarta, stileInput } from './stili'

type Props = {
  voci: VoceForm[]
  // Mette insieme gli esercizi scelti (per chiave) in una super serie con quel recupero (in secondi, come testo).
  alCrea: (chiavi: string[], recuperoSec: string) => void
}

// Il pulsante «Super Serie»: si scelgono 2 o più esercizi della giornata e si mettono insieme, da fare uno dopo l'altro senza
// pausa. Con 2 esercizi è un superset, con 3 un triset, con 4 o più un gigantset: il nome compare da solo mentre si sceglie.
// Si possono scegliere gli esercizi che non sono già in una super serie.
export function CreaSuperSerie({ voci, alCrea }: Props) {
  const [aperto, setAperto] = useState(false)
  const [scelti, setScelti] = useState<string[]>([])
  const [recupero, setRecupero] = useState(String(RECUPERO_PREDEFINITO))

  const disponibili = voci.filter((voce) => voce.gruppo === null)
  // Una scelta fatta prima e poi sparita dall'elenco (esercizio tolto, già messo in un gruppo) non conta più.
  const validi = scelti.filter((chiave) => disponibili.some((voce) => voce.chiave === chiave))
  const quanti = validi.length

  const recuperoNumero = parseIntero(recupero)
  const recuperoValido = recuperoNumero !== null && recuperoNumero >= 0 && recuperoNumero <= 900
  const pronto = quanti >= GRUPPO_MIN && quanti <= GRUPPO_MAX && recuperoValido

  function chiudi() {
    setAperto(false)
    setScelti([])
    setRecupero(String(RECUPERO_PREDEFINITO))
  }

  function alterna(chiave: string) {
    setScelti((prec) => (prec.includes(chiave) ? prec.filter((c) => c !== chiave) : [...prec, chiave]))
  }

  function crea() {
    if (!pronto) return
    // Nell'ordine in cui compaiono nella giornata, non in quello in cui sono stati toccati.
    const nellOrdine = voci.filter((voce) => validi.includes(voce.chiave)).map((voce) => voce.chiave)
    alCrea(nellOrdine, String(recuperoNumero))
    chiudi()
  }

  return (
    <section className={`${stileCarta} space-y-3 p-4`}>
      <h2 className="text-lg font-extrabold">Superset - Triset - Gigantset</h2>
      <p className="text-xs text-muto">
        Metti due o più esercizi uno dopo l&apos;altro, senza pausa tra l&apos;uno e l&apos;altro: 2 esercizi sono un SuperSet, 3 un
        TriSet, 4 o più un GigantSet.
      </p>
      <button
        type="button"
        aria-expanded={aperto}
        onClick={() => (aperto ? chiudi() : setAperto(true))}
        className={`${stileBottoneChiaro} touch-manipulation`}
      >
        {aperto ? 'Chiudi' : 'Super Serie'}
      </button>

      {aperto && (
        <div className="space-y-3">
          {disponibili.length < GRUPPO_MIN ? (
            <p className="rounded-2xl bg-carta-alta p-3 text-sm text-muto">
              Servono almeno due esercizi che non siano già in una super serie.
            </p>
          ) : (
            <>
              <fieldset className="space-y-2">
                <legend className="mb-1 text-sm font-semibold text-muto">Scegli gli esercizi</legend>
                {disponibili.map((voce) => {
                  const scelto = validi.includes(voce.chiave)
                  const pieno = !scelto && quanti >= GRUPPO_MAX
                  return (
                    <label
                      key={voce.chiave}
                      className={`flex touch-manipulation items-center gap-3 rounded-2xl border px-3 py-3 transition ${scelto ? 'border-accento bg-accento/10' : 'border-bordo bg-fondo'
                        } ${pieno ? 'opacity-50' : 'cursor-pointer active:opacity-80'}`}
                    >
                      <input
                        type="checkbox"
                        checked={scelto}
                        disabled={pieno}
                        onChange={() => alterna(voce.chiave)}
                        className="size-5 shrink-0 accent-accento"
                      />
                      <span className="min-w-0 flex-1 text-sm font-bold break-words">{voce.nome}</span>
                    </label>
                  )
                })}
              </fieldset>

              <p aria-live="polite" className="text-sm font-semibold text-accento">
                {quanti < GRUPPO_MIN
                  ? `Scegline almeno ${GRUPPO_MIN}`
                  : `${quanti} esercizi: ${nomeGruppo(quanti)}`}
              </p>

              <label className="block space-y-1 text-sm text-muto">
                <span>Recupero del gruppo (s)</span>
                <input
                  inputMode="numeric"
                  value={recupero}
                  onChange={(e) => setRecupero(e.target.value)}
                  className={stileInput}
                />
                <span className="block text-xs">Dopo ogni giro, cioè dopo l&apos;ultimo esercizio. Tra uno e l&apos;altro non c&apos;è pausa.</span>
              </label>
              {!recuperoValido && <p className="text-xs text-errore">Il recupero deve essere da 0 a 900 secondi.</p>}

              <div className="grid grid-cols-2 gap-2">
                <button type="button" onClick={chiudi} className={`${stileBottoneChiaro} touch-manipulation`}>
                  Annulla
                </button>
                <button
                  type="button"
                  onClick={crea}
                  disabled={!pronto}
                  className="touch-manipulation rounded-full bg-accento px-4 py-2.5 text-sm font-extrabold text-su-accento transition active:opacity-80 disabled:opacity-40"
                >
                  Crea
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </section>
  )
}
