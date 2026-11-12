'use client'

import { useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { salvaSessione } from '@/app/actions'
import type { Esercizio, Giorno } from '@/lib/scheda-tipi'
import { descrizioneObiettivo, formatTimer, haRipetizioniPerSerie, ripetizioniTarget, serieIniziali } from '@/lib/allenamento'
import { giroCompleto, nomeGruppo } from '@/lib/gruppi'
import { eliminaBozza, leggiBozza, salvaBozza } from '@/lib/bozza'
import { secondiDaTimer } from '@/lib/durata'
import { formatDataNumerica, formatNumero } from '@/lib/formato'
import { parseIntero, parseNumero } from '@/lib/numeri'
import { suggerimentoSerie, suggerisciCarichi, type SuggerimentoCarico } from '@/lib/progressi'
import type { UltimeVolte, VoceElenco } from '@/lib/tipi'
import { ElencoEsercizi } from './ElencoEsercizi'
import { ImmagineEsercizio } from './ImmagineEsercizio'
import { IconaCestino, IconaMeno, IconaPiu, IconaSpunta } from './icone'
import { IstruzioniEsercizio } from './IstruzioniEsercizio'
import { TempoTrascorso } from './TempoTrascorso'
import { stileBottoneChiaro, stileBottonePrimario, stileCarta, stileInput, stileTesto } from './stili'

type RigaSerie = { pesoKg: string; ripetizioni: string; confermata: boolean }

// Un esercizio è già della persona (esercizioId) oppure preso dal catalogo e non ancora suo (catalogoId): uno solo dei due.
// nomeEn serve alla riga piccola sotto il nome. Una bozza salvata prima del catalogo non ha catalogoId e nomeEn, e può avere
// ancora un esercizio scritto a mano (esercizioId vuoto): in quel caso l'esercizio si ritrova per nome all'apertura.
type EsSessione = {
  chiave: string
  esercizioId: number | null
  catalogoId?: number | null
  nomeNuovo?: string
  nome: string
  nomeEn?: string
  immagine?: string
  serie: RigaSerie[]
}

// Una bozza salvata quando c'erano anche i dati dell'orologio, o il campo dei minuti della durata, ha dei campi in più: si
// ignorano. `inizio` è l'ora in cui è iniziata la sessione (millisecondi): le bozze di prima non ce l'hanno.
type Bozza = {
  esercizi: EsSessione[]
  data: string
  note: string
  inizio?: number
}

type Props = {
  utenteId: number // la bozza nel browser è di questa persona: due account sullo stesso browser non se la vedono
  giorno: Giorno
  ultime: UltimeVolte
  elenco: VoceElenco[]
  oggi: string
}

const rigaVuota = (): RigaSerie => ({ pesoKg: '', ripetizioni: '', confermata: false })

function esercizioIniziale(esercizio: Esercizio): EsSessione {
  return {
    chiave: `e${esercizio.id}`,
    esercizioId: esercizio.id,
    catalogoId: null,
    nome: esercizio.nome,
    nomeEn: esercizio.nomeEn,
    immagine: esercizio.immagine,
    serie: Array.from({ length: serieIniziali(esercizio.obiettivo) }, rigaVuota),
  }
}

function testoSuggerimento(s: SuggerimentoCarico): string {
  if (s.daVerificare) return `Ultimo carico: ${formatNumero(s.kg)} kg (ripetizioni da verificare)`
  return s.aumenta
    ? `Prossimo carico: ${formatNumero(s.kg)} kg`
    : s.ripSerie
      ? `Resta a ${formatNumero(s.kg)} kg: completa ${s.ripSerie.join('-')} rip per salire`
      : `Resta a ${formatNumero(s.kg)} kg: completa ${s.ripMax} rip in ogni serie per salire`
}

export function FormSessione({ utenteId, giorno, ultime, elenco, oggi }: Props) {
  const router = useRouter()
  const definizioni = new Map(giorno.esercizi.map((e) => [e.id, e]))
  const suggerimentiCarico = suggerisciCarichi(giorno.esercizi, ultime)

  const [esercizi, setEsercizi] = useState<EsSessione[]>(() => giorno.esercizi.map(esercizioIniziale))
  const [data, setData] = useState(oggi)
  const [note, setNote] = useState('')
  const [errore, setErrore] = useState<string | null>(null)
  const [scaduta, setScaduta] = useState(false)
  const [erroreEsercizio, setErroreEsercizio] = useState<{ chiave: string; testo: string } | null>(null)
  const [sceltaAperta, setSceltaAperta] = useState(false)
  const [timer, setTimer] = useState<{ fine: number; totale: number } | null>(null)
  const [restano, setRestano] = useState(0)
  const [bozzaPronta, setBozzaPronta] = useState(false)
  // Quando è iniziata la sessione: serve a calcolare la durata. Si imposta all'apertura, insieme alla bozza (il server non
  // vede l'orologio del telefono).
  const [inizio, setInizio] = useState<number | null>(null)
  const [inCorso, startTransition] = useTransition()

  // All'apertura riprende la bozza di questa giornata, se c'è: si legge qui e non nello stato iniziale
  // perché il server non ha il localStorage e le due versioni della pagina non coinciderebbero.
  useEffect(() => {
    const bozza = leggiBozza<Bozza>(utenteId, giorno.id)
    if (bozza) {
      // Una bozza di prima del catalogo può avere esercizi scritti a mano, che ora non si salvano più: si cercano per nome
      // nell'elenco (suoi o del catalogo). Quelli che non si trovano si tolgono, e la persona viene avvisata.
      const perNome = new Map(elenco.map((voce) => [voce.nome.toLowerCase(), voce]))
      const persi: string[] = []
      const riportati = bozza.esercizi.flatMap((es): EsSessione[] => {
        if (es.esercizioId !== null || (es.catalogoId ?? null) !== null) return [es]
        const trovato = perNome.get(es.nome.toLowerCase())
        if (!trovato) {
          if (es.serie.some((s) => s.confermata)) persi.push(es.nome)
          return []
        }
        return [
          {
            ...es,
            esercizioId: trovato.id,
            catalogoId: trovato.id === null ? trovato.catalogoId : null,
            nome: trovato.nome,
            nomeEn: trovato.nomeEn,
            immagine: trovato.immagine,
          },
        ]
      })
      setEsercizi(riportati)
      setData(bozza.data)
      setNote(bozza.note)
      // L'allenamento è già iniziato solo se c'è almeno una serie confermata: una pagina aperta e poi lasciata lì non conta.
      const iniziata = riportati.some((es) => es.serie.some((riga) => riga.confermata))
      setInizio(iniziata && typeof bozza.inizio === 'number' && bozza.inizio <= Date.now() ? bozza.inizio : Date.now())
      if (persi.length > 0) {
        setErrore(
          `Questi esercizi erano scritti a mano e non si trovano più nell'elenco, quindi li ho tolti dalla bozza: ${persi.join(', ')}. Se avevi serie confermate, aggiungi l'esercizio giusto dall'elenco e riscrivile.`,
        )
      }
    } else {
      setInizio(Date.now())
    }
    setBozzaPronta(true)
    // La bozza si legge una volta sola all'apertura: l'elenco non cambia mentre si allena.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [utenteId, giorno.id])

  useEffect(() => {
    if (!bozzaPronta || inizio === null) return
    salvaBozza(utenteId, giorno.id, { esercizi, data, note, inizio } satisfies Bozza)
  }, [bozzaPronta, utenteId, giorno.id, esercizi, data, note, inizio])

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

  function ultimaDi(es: EsSessione) {
    return es.esercizioId ? ultime[es.esercizioId] : undefined
  }

  function suggerimento(es: EsSessione, indice: number) {
    const ultima = ultimaDi(es)
    const definizione = es.esercizioId ? definizioni.get(es.esercizioId) : undefined
    return suggerimentoSerie(
      ultima?.serie ?? [],
      indice,
      definizione ? ripetizioniTarget(definizione.obiettivo, indice) : null,
      ultima ? !ultima.datiIniziali : false,
      definizione ? haRipetizioniPerSerie(definizione.obiettivo) : false,
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
    if (definizione?.gruppo) {
      // Super serie: tra un esercizio e l'altro non c'è pausa. Il recupero parte quando il giro è finito, cioè quando tutti gli
      // esercizi del gruppo hanno confermato questa serie, e dura quanto il recupero del gruppo.
      const numero = definizione.gruppo.numero
      const membri = esercizi.filter((e) => e.esercizioId !== null && definizioni.get(e.esercizioId)?.gruppo?.numero === numero)
      if (!giroCompleto(membri, es.chiave, indice)) return
      const totale = definizione.gruppo.recuperoSec
      if (totale > 0) setTimer({ fine: Date.now() + totale * 1000, totale })
      return
    }
    if (definizione && definizione.obiettivo.recuperoSec > 0) {
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

  function aggiungiDallElenco(scelto: VoceElenco) {
    setEsercizi((prec) => [
      ...prec,
      {
        chiave: `elenco-${scelto.chiave}`,
        esercizioId: scelto.id,
        catalogoId: scelto.id === null ? scelto.catalogoId : null,
        nome: scelto.nome,
        nomeEn: scelto.nomeEn,
        immagine: scelto.immagine,
        serie: Array.from({ length: 3 }, rigaVuota),
      },
    ])
    setErrore(null)
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

    const invio = esercizi.map((es) => ({
      esercizioId: es.esercizioId,
      catalogoId: es.esercizioId === null ? (es.catalogoId ?? null) : null,
      serie: es.serie
        .filter((riga) => riga.confermata)
        .map((riga) => ({ pesoKg: parseNumero(riga.pesoKg), ripetizioni: parseIntero(riga.ripetizioni) })),
    }))

    if (invio.every((es) => es.serie.length === 0)) return setErrore('Conferma almeno una serie con ✓')

    // La durata è il tempo misurato dal cronometro, in secondi (niente se la seduta è di un altro giorno).
    const durataDaSalvare = secondiDaTimer(inizio, Date.now(), data, oggi)

    startTransition(async () => {
      let esito: Awaited<ReturnType<typeof salvaSessione>>
      try {
        esito = await salvaSessione(utenteId, {
          giornoId: giorno.id,
          data,
          note: note.trim() === '' ? null : note,
          durataSecondi: durataDaSalvare,
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

  // Gli esercizi già in questa sessione non si propongono di nuovo.
  const esclusi = new Set(
    esercizi.flatMap((es) => [
      ...(es.esercizioId !== null ? [`e${es.esercizioId}`] : []),
      ...((es.catalogoId ?? null) !== null ? [`c${es.catalogoId}`] : []),
    ]),
  )

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
        {esercizi.map((es, posizioneEsercizio) => {
          const ultima = ultimaDi(es)
          const definizione = es.esercizioId ? definizioni.get(es.esercizioId) : undefined
          // La super serie di questo esercizio: i suoi membri sono vicini (anche dopo aver tolto o aggiunto esercizi alla seduta).
          const numeroGruppo = definizione?.gruppo?.numero ?? null
          const membriGruppo =
            numeroGruppo === null
              ? []
              : esercizi.filter((e) => e.esercizioId !== null && definizioni.get(e.esercizioId)?.gruppo?.numero === numeroGruppo)
          const posizioneGruppo = membriGruppo.findIndex((e) => e.chiave === es.chiave)
          const nomeDelGruppo = membriGruppo.length >= 2 ? nomeGruppo(membriGruppo.length) : null
          const precedente = posizioneEsercizio > 0 ? esercizi[posizioneEsercizio - 1] : null
          const èAttaccatoAlPrecedente =
            nomeDelGruppo !== null &&
            precedente !== null &&
            precedente.esercizioId !== null &&
            definizioni.get(precedente.esercizioId)?.gruppo?.numero === numeroGruppo
          const carico = es.esercizioId ? suggerimentiCarico[es.esercizioId] : undefined
          const errorePerQuesto = erroreEsercizio?.chiave === es.chiave ? erroreEsercizio.testo : null

          return (
            <li
              key={es.chiave}
              className={`${stileCarta} space-y-3 p-4 ${nomeDelGruppo ? 'border-l-4 border-l-accento' : ''} ${
                èAttaccatoAlPrecedente ? '-mt-4 rounded-t-none border-t-0' : ''
              } ${nomeDelGruppo && posizioneGruppo < membriGruppo.length - 1 ? 'rounded-b-none' : ''}`}
              aria-label={nomeDelGruppo ? `${nomeDelGruppo} ${posizioneGruppo + 1} di ${membriGruppo.length}: ${es.nome}` : undefined}
            >
              {nomeDelGruppo && (
                <p className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="rounded-full bg-accento/15 px-2.5 py-1 font-extrabold text-accento">
                    {nomeDelGruppo} · {posizioneGruppo + 1}/{membriGruppo.length}
                  </span>
                  <span className="text-muto">
                    {posizioneGruppo < membriGruppo.length - 1
                      ? 'Una serie, poi passa subito al prossimo'
                      : definizione?.gruppo && definizione.gruppo.recuperoSec > 0
                        ? `Finito il giro, recupero ${formatTimer(definizione.gruppo.recuperoSec)}`
                        : 'Finito il giro, riparti subito'}
                  </span>
                </p>
              )}
              <div className="flex items-start justify-between gap-3">
                <ImmagineEsercizio src={es.immagine ?? ''} nome={es.nome} className="size-20" />
                <div className="min-w-0 flex-1">
                  <h3 className="text-lg font-extrabold leading-tight">{es.nome}</h3>
                  {es.nomeEn && <p className="text-xs text-muto">{es.nomeEn}</p>}
                  <p className="text-sm text-muto">
                    {definizione ? `Target ${descrizioneObiettivo(definizione.obiettivo)}` : 'Esercizio aggiunto'}
                    {ultima && ` · Suggerito da ultima seduta del ${formatDataNumerica(new Date(ultima.data))}`}
                  </p>
                  {carico && <p className="mt-1 text-sm font-semibold text-accento">{testoSuggerimento(carico)}</p>}
                  {/* La nota della scheda (di chi l'ha scritta: tu o il tuo personal trainer) sta qui, ben visibile: serve proprio
                      mentre ti alleni, per sapere come va fatto l'esercizio. Viene dalla scheda e non dalla bozza, quindi se
                      cambia la vedi aggiornata. Un esercizio aggiunto a metà sessione non ha nota. */}
                  {definizione?.nota && (
                    <p className="mt-2 rounded-xl bg-carta-alta px-3 py-2 text-sm break-words">
                      <span className="font-extrabold">Nota: </span>
                      {definizione.nota}
                    </p>
                  )}
                  <div className="mt-1">
                    <IstruzioniEsercizio catalogoId={es.catalogoId ?? null} esercizioId={es.esercizioId} nome={es.nome} />
                  </div>
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
        <button type="button" aria-expanded={sceltaAperta} onClick={() => setSceltaAperta((aperta) => !aperta)} className={stileBottoneChiaro}>
          {sceltaAperta ? 'Chiudi l’elenco' : 'Scegli dall’elenco'}
        </button>
        {sceltaAperta && <ElencoEsercizi elenco={elenco} esclusi={esclusi} alScelto={aggiungiDallElenco} />}
      </section>

      <section className={`${stileCarta} space-y-3 p-4`}>
        <h2 className="text-lg font-extrabold">Durata</h2>
        {/* Il cronometro: la durata si salva da sola, in ore, minuti e secondi, quando si salva la seduta. */}
        {inizio !== null && data === oggi ? (
          <>
            <p className="flex items-baseline justify-between gap-3 rounded-2xl bg-carta-alta px-4 py-3">
              <span className="text-sm font-semibold text-muto">Tempo di questa sessione</span>{' '}
              <span className="text-3xl leading-none font-extrabold text-accento">
                <TempoTrascorso inizio={inizio} />
              </span>
            </p>
            <p className="text-xs text-muto">Si salva da solo nello storico quando salvi la seduta.</p>
          </>
        ) : (
          <p className="text-sm text-muto">Hai scelto un altro giorno: la durata non si salva, perché il cronometro misura la sessione di oggi.</p>
        )}
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
