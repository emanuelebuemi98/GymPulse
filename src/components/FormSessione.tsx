'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { salvaSessione } from '@/app/actions'
import type { Esercizio, Giorno } from '@/lib/scheda-tipi'
import { formatTimer, ripetizioniTarget, serieIniziali } from '@/lib/allenamento'
import { eliminaBozza, leggiBozza, salvaBozza } from '@/lib/bozza'
import { dataIso, formatDataNumerica, formatNumero } from '@/lib/formato'
import { parseIntero, parseNumero } from '@/lib/numeri'
import { suggerimentoSerie, suggerisciCarichi, type SuggerimentoCarico } from '@/lib/progressi'
import { leggiTcx } from '@/lib/tcx'
import type { UltimeVolte, VoceCatalogo } from '@/lib/tipi'
import { IconaCarica, IconaCestino, IconaMeno, IconaPiu, IconaSpunta } from './icone'
import { stileBottoneChiaro, stileBottonePrimario, stileCarta, stileInput, stileTesto } from './stili'

type RigaSerie = { pesoKg: string; ripetizioni: string; confermata: boolean }

type EsSessione = {
  chiave: string
  esercizioId: number | null // null = esercizio nuovo, creato al salvataggio
  nomeNuovo: string
  nome: string
  serie: RigaSerie[]
}

// I campi dell'orologio possono mancare in una bozza salvata prima che esistessero.
type Bozza = {
  esercizi: EsSessione[]
  data: string
  note: string
  durata: string
  fcMedia?: string
  fcMax?: string
  kcal?: string
}

type Props = {
  utenteId: number // la bozza nel browser è di questa persona: due account sullo stesso browser non se la vedono
  giorno: Giorno
  ultime: UltimeVolte
  catalogo: VoceCatalogo[]
  oggi: string
}

const rigaVuota = (): RigaSerie => ({ pesoKg: '', ripetizioni: '', confermata: false })

function esercizioIniziale(esercizio: Esercizio): EsSessione {
  return {
    chiave: `e${esercizio.id}`,
    esercizioId: esercizio.id,
    nomeNuovo: '',
    nome: esercizio.nome,
    serie: Array.from({ length: serieIniziali(esercizio.obiettivo) }, rigaVuota),
  }
}

function testoSuggerimento(s: SuggerimentoCarico): string {
  if (s.daVerificare) return `Ultimo carico: ${formatNumero(s.kg)} kg (ripetizioni da verificare)`
  return s.aumenta
    ? `Prossimo carico: ${formatNumero(s.kg)} kg`
    : `Resta a ${formatNumero(s.kg)} kg: completa ${s.ripMax} rip in ogni serie per salire`
}

export function FormSessione({ utenteId, giorno, ultime, catalogo, oggi }: Props) {
  const router = useRouter()
  const definizioni = new Map(giorno.esercizi.map((e) => [e.id, e]))
  const suggerimentiCarico = suggerisciCarichi(giorno.esercizi, ultime)

  const [esercizi, setEsercizi] = useState<EsSessione[]>(() => giorno.esercizi.map(esercizioIniziale))
  const [data, setData] = useState(oggi)
  const [note, setNote] = useState('')
  const [durata, setDurata] = useState('')
  const [fcMedia, setFcMedia] = useState('')
  const [fcMax, setFcMax] = useState('')
  const [kcal, setKcal] = useState('')
  const [esitoFile, setEsitoFile] = useState<{ testo: string; errore: boolean } | null>(null)
  const fileOrologio = useRef<HTMLInputElement>(null)
  const [errore, setErrore] = useState<string | null>(null)
  const [scaduta, setScaduta] = useState(false)
  const [erroreEsercizio, setErroreEsercizio] = useState<{ chiave: string; testo: string } | null>(null)
  const [aggiunta, setAggiunta] = useState<number | null>(null)
  const [nomeLibero, setNomeLibero] = useState('')
  const [timer, setTimer] = useState<{ fine: number; totale: number } | null>(null)
  const [restano, setRestano] = useState(0)
  const [bozzaPronta, setBozzaPronta] = useState(false)
  const [inCorso, startTransition] = useTransition()
  const contatore = useRef(0)

  // All'apertura riprende la bozza di questa giornata, se c'è: si legge qui e non nello stato iniziale
  // perché il server non ha il localStorage e le due versioni della pagina non coinciderebbero.
  useEffect(() => {
    const bozza = leggiBozza<Bozza>(utenteId, giorno.id)
    if (bozza) {
      setEsercizi(bozza.esercizi)
      setData(bozza.data)
      setNote(bozza.note)
      setDurata(bozza.durata)
      setFcMedia(bozza.fcMedia ?? '')
      setFcMax(bozza.fcMax ?? '')
      setKcal(bozza.kcal ?? '')
    }
    setBozzaPronta(true)
  }, [utenteId, giorno.id])

  useEffect(() => {
    if (!bozzaPronta) return
    salvaBozza(utenteId, giorno.id, { esercizi, data, note, durata, fcMedia, fcMax, kcal } satisfies Bozza)
  }, [bozzaPronta, utenteId, giorno.id, esercizi, data, note, durata, fcMedia, fcMax, kcal])

  useEffect(() => {
    if (!timer) return
    const aggiorna = () => {
      const mancano = Math.max(0, Math.ceil((timer.fine - Date.now()) / 1000))
      setRestano(mancano)
      if (mancano === 0) {
        try {
          navigator.vibrate?.([200, 100, 200])
        } catch {
          // la vibrazione non è disponibile ovunque
        }
      }
    }
    aggiorna()
    const intervallo = setInterval(aggiorna, 250)
    return () => clearInterval(intervallo)
  }, [timer])

  const righeTotali = esercizi.reduce((totale, e) => totale + e.serie.length, 0)
  const righeConfermate = esercizi.reduce((totale, e) => totale + e.serie.filter((s) => s.confermata).length, 0)
  const durataMinuti = parseIntero(durata)

  // Legge un file TCX esportato dall'app dell'orologio e compila i campi. Il file resta nel browser: al server
  // arrivano solo i numeri, quando salvi. I campi restano modificabili a mano.
  async function alFileOrologio(evento: React.ChangeEvent<HTMLInputElement>) {
    const scelto = evento.target.files?.[0]
    evento.target.value = ''
    if (!scelto) return
    setEsitoFile(null)

    const letto = leggiTcx(await scelto.text())
    if (!letto.ok) {
      setEsitoFile({ testo: letto.errore, errore: true })
      return
    }
    const { dati } = letto
    if (dati.durataMinuti !== null) setDurata(String(dati.durataMinuti))
    setFcMedia(dati.fcMediaBpm === null ? '' : String(dati.fcMediaBpm))
    setFcMax(dati.fcMassimaBpm === null ? '' : String(dati.fcMassimaBpm))
    setKcal(dati.kcalOrologio === null ? '' : String(dati.kcalOrologio))

    // Il file di un altro giorno è quasi sempre un errore di scelta: lo si dice, senza cambiare la data.
    const giornoFile = dati.inizio ? dataIso(dati.inizio) : null
    const altroGiorno = giornoFile !== null && giornoFile !== data
    setEsitoFile({
      testo: altroGiorno
        ? `Letto, ma l'allenamento nel file è del ${formatDataNumerica(dati.inizio!)} e la sessione è del ${formatDataNumerica(new Date(`${data}T12:00:00Z`))}: controlla di aver scelto il file giusto.`
        : 'Dati letti dal file: controllali e correggili se serve.',
      errore: altroGiorno,
    })
  }

  function ultimaDi(es: EsSessione) {
    return es.esercizioId ? ultime[es.esercizioId] : undefined
  }

  function suggerimento(es: EsSessione, indice: number) {
    const ultima = ultimaDi(es)
    const definizione = es.esercizioId ? definizioni.get(es.esercizioId) : undefined
    return suggerimentoSerie(
      ultima?.serie ?? [],
      indice,
      definizione ? ripetizioniTarget(definizione.obiettivo) : null,
      ultima ? !ultima.datiIniziali : false,
    )
  }

  function aggiorna(chiave: string, cambia: (es: EsSessione) => EsSessione) {
    setEsercizi((prec) => prec.map((es) => (es.chiave === chiave ? cambia(es) : es)))
  }

  function modificaRiga(chiave: string, indice: number, patch: Partial<RigaSerie>) {
    aggiorna(chiave, (es) => ({
      ...es,
      serie: es.serie.map((riga, i) => (i === indice ? { ...riga, ...patch } : riga)),
    }))
  }

  function conferma(es: EsSessione, indice: number) {
    const riga = es.serie[indice]
    if (riga.confermata) {
      modificaRiga(es.chiave, indice, { confermata: false })
      return
    }

    // Con i campi vuoti vale quello che l'app suggeriva in grigio.
    const proposto = suggerimento(es, indice)
    const kg = riga.pesoKg.trim() !== '' ? riga.pesoKg : proposto.pesoKg === null ? '' : String(proposto.pesoKg)
    const rip = riga.ripetizioni.trim() !== '' ? riga.ripetizioni : proposto.ripetizioni === null ? '' : String(proposto.ripetizioni)

    if (kg.trim() !== '' && parseNumero(kg) === null) {
      setErroreEsercizio({ chiave: es.chiave, testo: `Serie ${indice + 1}: il peso non è valido` })
      return
    }
    const ripetizioni = parseIntero(rip)
    if (ripetizioni === null || ripetizioni < 1) {
      setErroreEsercizio({ chiave: es.chiave, testo: `Serie ${indice + 1}: indica le ripetizioni fatte` })
      return
    }

    setErroreEsercizio(null)
    modificaRiga(es.chiave, indice, { pesoKg: kg, ripetizioni: String(ripetizioni), confermata: true })

    const definizione = es.esercizioId ? definizioni.get(es.esercizioId) : undefined
    if (definizione?.obiettivo.tipo === 'serie' && definizione.obiettivo.recuperoSec > 0) {
      const totale = definizione.obiettivo.recuperoSec
      setTimer({ fine: Date.now() + totale * 1000, totale })
    }
  }

  function applicaSuggeriti(es: EsSessione) {
    aggiorna(es.chiave, (corrente) => ({
      ...corrente,
      serie: corrente.serie.map((riga, i) => {
        if (riga.confermata) return riga
        const s = suggerimento(corrente, i)
        return {
          ...riga,
          pesoKg: riga.pesoKg.trim() !== '' || s.pesoKg === null ? riga.pesoKg : String(s.pesoKg),
          ripetizioni: riga.ripetizioni.trim() !== '' || s.ripetizioni === null ? riga.ripetizioni : String(s.ripetizioni),
        }
      }),
    }))
  }

  function togliSerie(es: EsSessione) {
    // Toglie l'ultima serie non confermata; se sono tutte confermate non toglie nulla.
    const indice = es.serie.map((s) => s.confermata).lastIndexOf(false)
    if (indice === -1) return
    aggiorna(es.chiave, (corrente) => ({ ...corrente, serie: corrente.serie.filter((_, i) => i !== indice) }))
  }

  function rimuoviEsercizio(es: EsSessione) {
    if (es.serie.some((s) => s.confermata) && !window.confirm(`Rimuovere ${es.nome}? Le serie confermate andranno perse.`)) return
    setEsercizi((prec) => prec.filter((corrente) => corrente.chiave !== es.chiave))
  }

  function aggiungiDalCatalogo() {
    const scelto = aggiunta === null ? undefined : catalogo.find((voce) => voce.id === aggiunta)
    if (!scelto) return
    setEsercizi((prec) => [
      ...prec,
      {
        chiave: `catalogo-${scelto.id}`,
        esercizioId: scelto.id,
        nomeNuovo: '',
        nome: scelto.nome,
        serie: Array.from({ length: 3 }, rigaVuota),
      },
    ])
    setAggiunta(null)
  }

  function aggiungiLibero() {
    const nome = nomeLibero.trim()
    if (nome === '') return
    const esistente = catalogo.find((voce) => voce.nome.toLowerCase() === nome.toLowerCase())
    const giaPresente = esercizi.some((es) => es.nome.toLowerCase() === nome.toLowerCase())
    if (giaPresente) {
      setErrore(`${nome} è già in questa sessione`)
      return
    }
    setErrore(null)
    contatore.current += 1
    setEsercizi((prec) => [
      ...prec,
      {
        chiave: `nuovo-${Date.now()}-${contatore.current}`,
        esercizioId: esistente ? esistente.id : null,
        nomeNuovo: esistente ? '' : nome,
        nome: esistente ? esistente.nome : nome,
        serie: Array.from({ length: 3 }, rigaVuota),
      },
    ])
    setNomeLibero('')
  }

  function annulla() {
    if (righeConfermate > 0 && !window.confirm('Annullare la sessione? Le serie confermate andranno perse.')) return
    eliminaBozza(utenteId, giorno.id)
    router.push(`/scheda?r=${giorno.id}`)
  }

  function salva() {
    setErrore(null)
    setScaduta(false)
    setErroreEsercizio(null)

    if (durata.trim() !== '' && durataMinuti === null) return setErrore('La durata deve essere un numero intero di minuti')
    const fcMediaBpm = parseIntero(fcMedia)
    const fcMassimaBpm = parseIntero(fcMax)
    const kcalOrologio = parseIntero(kcal)
    if (fcMedia.trim() !== '' && fcMediaBpm === null) return setErrore('La frequenza media deve essere un numero intero')
    if (fcMax.trim() !== '' && fcMassimaBpm === null) return setErrore('La frequenza massima deve essere un numero intero')
    if (kcal.trim() !== '' && kcalOrologio === null) return setErrore('Le calorie devono essere un numero intero')

    const invio = esercizi.map((es) => ({
      esercizioId: es.esercizioId,
      nomeNuovo: es.esercizioId === null ? es.nomeNuovo : null,
      serie: es.serie
        .filter((riga) => riga.confermata)
        .map((riga) => ({ pesoKg: parseNumero(riga.pesoKg), ripetizioni: parseIntero(riga.ripetizioni) })),
    }))

    if (invio.every((es) => es.serie.length === 0)) return setErrore('Conferma almeno una serie con ✓')

    startTransition(async () => {
      let esito: Awaited<ReturnType<typeof salvaSessione>>
      try {
        esito = await salvaSessione(utenteId, {
          giornoId: giorno.id,
          data,
          note: note.trim() === '' ? null : note,
          durataMinuti,
          fcMediaBpm,
          fcMassimaBpm,
          kcalOrologio,
          esercizi: invio,
        })
      } catch {
        // Se l'accesso è scaduto del tutto, il server risponde con la pagina di login e non con il risultato
        // dell'azione; lo stesso succede senza connessione. In entrambi i casi la sessione resta nel telefono.
        setScaduta(true)
        return setErrore('Non sono riuscito a salvare: manca la connessione oppure l’accesso è scaduto. Le serie confermate restano nel telefono.')
      }
      if ('errore' in esito) {
        setScaduta(esito.scaduta === true)
        return setErrore(esito.errore)
      }
      eliminaBozza(utenteId, giorno.id)
      router.push(`/storico/${esito.id}`)
    })
  }

  const disponibili = catalogo.filter((voce) => !esercizi.some((es) => es.esercizioId === voce.id))

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-extrabold tracking-tight">Sessione in corso</h1>
        <button type="button" onClick={annulla} className={stileBottoneChiaro}>
          Annulla
        </button>
      </div>

      <section className={`${stileCarta} space-y-3 p-4`}>
        <h2 className="text-lg font-extrabold">
          Allenamento {giorno.id} · {giorno.titolo}
        </h2>
        <label className="block space-y-1 text-sm text-muto">
          <span>Data</span>
          <input
            type="date"
            value={data}
            max={oggi}
            onChange={(e) => setData(e.target.value)}
            className={`${stileTesto} text-left`}
          />
        </label>
        <label className="block space-y-1 text-sm text-muto">
          <span>Note e riscaldamento</span>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            maxLength={500}
            placeholder="Es. Riscaldamento: plank e corde 3 × 1"
            className={`${stileTesto} resize-none`}
          />
        </label>
        <p className="text-sm text-muto">
          Serie confermate: <span className="font-extrabold text-accento">{righeConfermate}</span> / {righeTotali}
        </p>
      </section>

      <ul className="space-y-4">
        {esercizi.map((es) => {
          const ultima = ultimaDi(es)
          const definizione = es.esercizioId ? definizioni.get(es.esercizioId) : undefined
          const carico = es.esercizioId ? suggerimentiCarico[es.esercizioId] : undefined
          const errorePerQuesto = erroreEsercizio?.chiave === es.chiave ? erroreEsercizio.testo : null

          return (
            <li key={es.chiave} className={`${stileCarta} space-y-3 p-4`}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="text-lg font-extrabold leading-tight">{es.nome}</h3>
                  <p className="text-sm text-muto">
                    {definizione ? `Target ${descrizione(definizione)}` : 'Esercizio aggiunto'}
                    {ultima && ` · Suggerito da ultima seduta del ${formatDataNumerica(new Date(ultima.data))}`}
                  </p>
                  {carico && <p className="mt-1 text-sm font-semibold text-accento">{testoSuggerimento(carico)}</p>}
                </div>
                <button
                  type="button"
                  aria-label={`Rimuovi ${es.nome}`}
                  onClick={() => rimuoviEsercizio(es)}
                  className="grid size-10 shrink-0 place-items-center rounded-xl bg-errore/10 text-errore"
                >
                  <IconaCestino className="size-4" />
                </button>
              </div>

              <div className="grid grid-cols-[1.75rem_1fr_1fr_3rem] items-center gap-x-2 gap-y-2">
                <span className="text-xs font-semibold text-muto">#</span>
                <span className="text-center text-xs font-semibold text-muto">Kg</span>
                <span className="text-center text-xs font-semibold text-muto">Ripetizioni</span>
                <span className="text-center text-xs font-semibold text-muto">Conferma</span>

                {es.serie.map((riga, indice) => {
                  const proposto = suggerimento(es, indice)
                  return (
                    <RigaSerieCampi
                      key={indice}
                      nome={es.nome}
                      indice={indice}
                      riga={riga}
                      pesoSuggerito={proposto.pesoKg === null ? '' : String(proposto.pesoKg)}
                      ripSuggerite={proposto.ripetizioni === null ? '' : String(proposto.ripetizioni)}
                      alCambio={(patch) => modificaRiga(es.chiave, indice, patch)}
                      alConferma={() => conferma(es, indice)}
                    />
                  )
                })}
              </div>

              {errorePerQuesto && (
                <p role="alert" className="text-sm text-errore">
                  {errorePerQuesto}
                </p>
              )}

              <div className="grid grid-cols-3 gap-2">
                <button type="button" onClick={() => applicaSuggeriti(es)} disabled={!ultima && !definizione} className={stileBottoneChiaro}>
                  Suggeriti
                </button>
                <button
                  type="button"
                  onClick={() => aggiorna(es.chiave, (corrente) => ({ ...corrente, serie: [...corrente.serie, rigaVuota()] }))}
                  className={stileBottoneChiaro}
                >
                  <IconaPiu className="size-4" />
                  Serie
                </button>
                <button type="button" onClick={() => togliSerie(es)} className={stileBottoneChiaro}>
                  <IconaMeno className="size-4" />
                  Serie
                </button>
              </div>
              <p className="text-xs text-muto">I valori grigi sono solo suggerimenti: la serie conta solo dopo ✓.</p>
            </li>
          )
        })}
      </ul>

      <section className={`${stileCarta} space-y-3 p-4`}>
        <h2 className="text-lg font-extrabold">Aggiungi esercizio</h2>
        <div className="grid grid-cols-[1fr_auto] gap-2">
          <select
            value={aggiunta ?? ''}
            onChange={(e) => setAggiunta(e.target.value === '' ? null : Number(e.target.value))}
            className={`${stileTesto} text-left`}
          >
            <option value="">Dalle routine…</option>
            {disponibili.map((voce) => (
              <option key={voce.id} value={voce.id}>
                {voce.nome}
              </option>
            ))}
          </select>
          <button type="button" aria-label="Aggiungi l'esercizio scelto" disabled={aggiunta === null} onClick={aggiungiDalCatalogo} className={`${stileBottoneChiaro} px-4`}>
            <IconaPiu className="size-5" />
          </button>
        </div>
        <div className="grid grid-cols-[1fr_auto] gap-2">
          <input
            value={nomeLibero}
            onChange={(e) => setNomeLibero(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                aggiungiLibero()
              }
            }}
            maxLength={60}
            placeholder="Altro esercizio"
            className={`${stileTesto} text-left`}
          />
          <button type="button" aria-label="Aggiungi l'esercizio scritto" disabled={nomeLibero.trim() === ''} onClick={aggiungiLibero} className={`${stileBottoneChiaro} px-4`}>
            <IconaPiu className="size-5" />
          </button>
        </div>
      </section>

      <section className={`${stileCarta} space-y-3 p-4`}>
        <h2 className="text-lg font-extrabold">Durata e orologio</h2>
        <p className="text-sm text-muto">
          Tutto facoltativo. Se hai un orologio, esporta l&apos;allenamento in TCX dalla sua app e scegli il file: i
          numeri si compilano da soli.
        </p>
        <button type="button" onClick={() => fileOrologio.current?.click()} className={stileBottoneChiaro}>
          <IconaCarica className="size-4" />
          Leggi da file TCX
        </button>
        <input ref={fileOrologio} type="file" accept=".tcx,application/xml,text/xml" onChange={alFileOrologio} className="hidden" />
        {esitoFile && (
          <p role={esitoFile.errore ? 'alert' : 'status'} className={`text-sm ${esitoFile.errore ? 'text-errore' : 'text-ok'}`}>
            {esitoFile.testo}
          </p>
        )}
        <div className="grid grid-cols-2 gap-3">
          <CampoOrologio etichetta="Minuti" segnaposto="60" valore={durata} alCambio={setDurata} />
          <CampoOrologio etichetta="Calorie (kcal)" segnaposto="320" valore={kcal} alCambio={setKcal} />
          <CampoOrologio etichetta="Battiti medi" segnaposto="115" valore={fcMedia} alCambio={setFcMedia} />
          <CampoOrologio etichetta="Battiti massimi" segnaposto="160" valore={fcMax} alCambio={setFcMax} />
        </div>
      </section>

      {errore && (
        <div role="alert" className="space-y-2 rounded-xl bg-errore/10 p-3 text-sm text-errore">
          <p>{errore}</p>
          {scaduta && (
            // Un link vero e non il router: si esce dall'app e si torna qui dopo l'accesso, con la sessione ripresa.
            <a
              href={`/login?da=${encodeURIComponent(`/sessione?r=${giorno.id}`)}`}
              className="inline-block rounded-full bg-errore px-4 py-2 font-bold text-su-accento"
            >
              Accedi di nuovo e riprendi
            </a>
          )}
        </div>
      )}

      <button type="button" onClick={salva} disabled={inCorso} className={stileBottonePrimario}>
        {inCorso ? 'Salvataggio…' : 'Salva seduta'}
      </button>

      {timer && (
        <div
          role="timer"
          aria-live="off"
          className="fixed inset-x-4 z-10 mx-auto flex max-w-sm items-center justify-between rounded-full bg-inchiostro py-2 pr-2 pl-6 text-su-inchiostro shadow-lg"
          style={{ bottom: 'calc(1rem + env(safe-area-inset-bottom))' }}
        >
          <div>
            <p className="text-xs font-semibold text-su-inchiostro/70">{restano === 0 ? 'Recupero finito' : 'Recupero'}</p>
            <p className="text-2xl leading-tight font-extrabold tabular-nums text-accento-chiaro">{formatTimer(restano)}</p>
          </div>
          <button
            type="button"
            onClick={() => setTimer(null)}
            className="rounded-full bg-su-inchiostro px-5 py-3 text-sm font-bold text-inchiostro active:opacity-80"
          >
            {restano === 0 ? 'Chiudi' : 'Salta'}
          </button>
        </div>
      )}
    </div>
  )
}

function CampoOrologio(props: { etichetta: string; segnaposto: string; valore: string; alCambio: (valore: string) => void }) {
  return (
    <label className="block space-y-1 text-sm text-muto">
      <span>{props.etichetta}</span>
      <input
        inputMode="numeric"
        placeholder={props.segnaposto}
        value={props.valore}
        onChange={(e) => props.alCambio(e.target.value)}
        className={stileInput}
      />
    </label>
  )
}

function descrizione(esercizio: Esercizio): string {
  const o = esercizio.obiettivo
  if (o.tipo === 'serie') return o.ripMin === o.ripMax ? `${o.serie} × ${o.ripMin}` : `${o.serie} × ${o.ripMin}-${o.ripMax}`
  if (o.tipo === 'totale') return `${o.ripTotali} ripetizioni totali`
  return o.serieMin === o.serieMax ? `${o.serieMin} serie` : `${o.serieMin}-${o.serieMax} serie`
}

function RigaSerieCampi(props: {
  nome: string
  indice: number
  riga: RigaSerie
  pesoSuggerito: string
  ripSuggerite: string
  alCambio: (patch: Partial<RigaSerie>) => void
  alConferma: () => void
}) {
  const { nome, indice, riga, pesoSuggerito, ripSuggerite, alCambio, alConferma } = props
  const colore = riga.confermata ? 'border-ok/60 bg-carta' : ''
  return (
    <>
      <span className="text-sm font-semibold text-muto">{indice + 1}</span>
      <input
        aria-label={`${nome}, serie ${indice + 1}: peso in kg`}
        inputMode="decimal"
        placeholder={pesoSuggerito}
        value={riga.pesoKg}
        onChange={(e) => alCambio({ pesoKg: e.target.value })}
        className={`${stileInput} ${colore}`}
      />
      <input
        aria-label={`${nome}, serie ${indice + 1}: ripetizioni`}
        inputMode="numeric"
        placeholder={ripSuggerite}
        value={riga.ripetizioni}
        onChange={(e) => alCambio({ ripetizioni: e.target.value })}
        className={`${stileInput} ${colore}`}
      />
      <button
        type="button"
        aria-pressed={riga.confermata}
        aria-label={`${riga.confermata ? 'Annulla conferma della' : 'Conferma la'} serie ${indice + 1} di ${nome}`}
        onClick={alConferma}
        className={`grid size-12 place-items-center justify-self-center rounded-full transition ${
          riga.confermata ? 'bg-ok text-su-accento' : 'border border-bordo bg-carta-alta text-muto'
        }`}
      >
        <IconaSpunta className="size-5" />
      </button>
    </>
  )
}
