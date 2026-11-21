'use client'

import { useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { anteprimaImportScheda, importaScheda, type AnteprimaScheda } from '@/app/actions'
import { anteprimaImportSchedaAllievo, importaSchedaAllievo } from '@/app/trainer/actions'
import { IconaCarica, IconaScarica } from './icone'
import { stileBottoneChiaro, stileBottonePrimario, stileCarta } from './stili'

// Stesso limite di LIMITE_CSV in lib/csv.ts: il file si scarta prima di inviarlo.
const LIMITE_CSV = 900_000

const esercizi = (n: number) => (n === 1 ? '1 esercizio' : `${n} esercizi`)

// Costruire la scheda da un file CSV: si scarica il catalogo (o la scheda attuale), si tolgono le righe che non servono, si
// reimporta. Prima di scrivere si fa vedere cosa cambia e si chiede conferma.
// Per un personal trainer (`allievo`, l'utente di cui è la scheda) il riquadro lavora sulla scheda di quell'allievo: scarica la sua
// scheda e importa un file sopra di essa, così la scheda fatta per uno si carica identica per un altro. Del file non c'è altro che
// la scheda: kg e storico non ci sono.
export function CsvScheda({ utenteId, allievo }: { utenteId: number; allievo?: { id: number; nome: string } }) {
  const router = useRouter()
  const file = useRef<HTMLInputElement>(null)
  const [testo, setTesto] = useState<string | null>(null)
  const [anteprima, setAnteprima] = useState<AnteprimaScheda | null>(null)
  const [messaggio, setMessaggio] = useState<{ testo: string; errore: boolean } | null>(null)
  const [inCorso, startTransition] = useTransition()

  function annulla() {
    setTesto(null)
    setAnteprima(null)
  }

  async function alScelto(evento: React.ChangeEvent<HTMLInputElement>) {
    const scelto = evento.target.files?.[0]
    evento.target.value = ''
    if (!scelto) return
    annulla()
    setMessaggio(null)

    if (scelto.size > LIMITE_CSV) {
      setMessaggio({ testo: 'Il file è troppo grande per essere importato', errore: true })
      return
    }

    const letto = await scelto.text()
    startTransition(async () => {
      const esito = allievo
        ? await anteprimaImportSchedaAllievo(utenteId, allievo.id, letto)
        : await anteprimaImportScheda(utenteId, letto)
      if ('errore' in esito) {
        setMessaggio({ testo: esito.errore, errore: true })
        return
      }
      setTesto(letto)
      setAnteprima(esito)
    })
  }

  function conferma() {
    if (testo === null) return
    startTransition(async () => {
      const esito = allievo ? await importaSchedaAllievo(utenteId, allievo.id, testo) : await importaScheda(utenteId, testo)
      if ('errore' in esito) {
        setMessaggio({ testo: esito.errore, errore: true })
        annulla()
        return
      }
      setMessaggio({
        testo: `Fatto: ${esito.giornate === 1 ? '1 giornata scritta' : `${esito.giornate} giornate scritte`}, ${esercizi(esito.esercizi)} in tutto.`,
        errore: false,
      })
      annulla()
      router.refresh()
    })
  }

  return (
    <section className={`${stileCarta} space-y-3 p-4`}>
      {allievo ? (
        <>
          <h2 className="text-lg font-extrabold">Scheda in un file CSV</h2>
          <ol className="list-decimal space-y-1 pl-5 text-sm text-muto">
            <li>
              Scarica la scheda di <span className="font-semibold text-testo">{allievo.nome}</span>: è un file con le sue giornate e i
              suoi esercizi, senza kg né storico.
            </li>
            <li>
              Apri la scheda di un altro allievo e importa lo stesso file: avrà le stesse giornate, con gli stessi esercizi, serie,
              recuperi e note.
            </li>
            <li>Prima di scrivere vedi cosa cambia, poi confermi.</li>
          </ol>
          <a href={`/api/scheda-csv?cosa=scheda&allievo=${allievo.id}`} download className={`${stileBottoneChiaro} w-full`}>
            <IconaScarica className="size-4" />
            Scarica la scheda di {allievo.nome}
          </a>
        </>
      ) : (
        <>
          <h2 className="text-lg font-extrabold">Crea la scheda da un file CSV</h2>
          <ol className="list-decimal space-y-1 pl-5 text-sm text-muto">
            <li>
              Scarica il <span className="font-semibold text-testo">catalogo completo</span>.
            </li>
            <li>Aprilo in Excel e cancella le righe degli esercizi che non ti servono.</li>
            <li>
              Nella colonna «giornata» sostituisci <span className="font-mono text-xs text-testo">&lt;A/B/C/D/E/F/G&gt;</span> con la
              lettera della tua giornata: A, B, C… (fino a 7).
            </li>
            <li>Torna qui e importa il file: prima vedi cosa cambia, poi confermi.</li>
          </ol>

          <div className="grid grid-cols-2 gap-2">
            <a href="/api/scheda-csv?cosa=catalogo" download className={stileBottoneChiaro}>
              <IconaScarica className="size-4" />
              Catalogo
            </a>
            <a href="/api/scheda-csv?cosa=scheda" download className={stileBottoneChiaro}>
              <IconaScarica className="size-4" />
              La mia scheda
            </a>
          </div>
        </>
      )}
      <button type="button" disabled={inCorso} onClick={() => file.current?.click()} className={`${stileBottoneChiaro} w-full`}>
        <IconaCarica className="size-4" />
        {inCorso && anteprima === null ? 'Leggo il file…' : 'Importa un file'}
      </button>
      <input ref={file} type="file" accept=".csv,text/csv" onChange={alScelto} className="hidden" />

      {anteprima && (
        <div className="space-y-3 rounded-2xl bg-carta-alta p-3 text-sm">
          <p className="font-semibold">Con questo file succede così:</p>
          <ul className="space-y-1">
            {anteprima.giornate.map((giornata) => (
              <li key={giornata.id}>
                <span className="font-extrabold">{giornata.id}</span> · {giornata.titolo}:{' '}
                {giornata.nuova
                  ? `giornata nuova con ${esercizi(giornata.eserciziDopo)}`
                  : `${esercizi(giornata.eserciziPrima)} → ${esercizi(giornata.eserciziDopo)}`}
              </li>
            ))}
          </ul>
          <p className="text-xs text-muto">
            Le giornate nel file vengono rifatte: i loro esercizi di prima si tolgono. Le altre non cambiano. Lo storico e i
            carichi già registrati restano.
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button type="button" disabled={inCorso} onClick={annulla} className={stileBottoneChiaro}>
              Annulla
            </button>
            <button type="button" disabled={inCorso} onClick={conferma} className={`${stileBottonePrimario} !py-2.5 !text-sm`}>
              {inCorso ? 'Scrivo…' : 'Conferma'}
            </button>
          </div>
        </div>
      )}

      {messaggio && (
        <p role={messaggio.errore ? 'alert' : 'status'} className={`text-sm ${messaggio.errore ? 'text-errore' : 'text-ok'}`}>
          {messaggio.testo}
        </p>
      )}
    </section>
  )
}
