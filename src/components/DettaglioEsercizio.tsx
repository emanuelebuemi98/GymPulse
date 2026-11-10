import type { DettaglioEsercizio } from '@/lib/tipi'
import { ImmagineEsercizio } from './ImmagineEsercizio'

type Props = {
  nome: string
  dettaglio: DettaglioEsercizio | null
  inCorso: boolean
  errore: boolean
}

// Il riquadro con la foto, i muscoli, i passi e le accortezze di un esercizio. È solo da guardare: chi lo usa decide
// quando aprirlo e va a leggere i dati dal server (leggiDettaglio). Lo usano "Come si fa" della scheda e il catalogo.
export function DettaglioEsercizioVista({ nome, dettaglio, inCorso, errore }: Props) {
  const vuoto = dettaglio !== null && dettaglio.esecuzione.length === 0 && dettaglio.accortezze.length === 0

  return (
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
  )
}
