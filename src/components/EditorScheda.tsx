'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { salvaScheda } from '@/app/actions'
import { salvaSchedaAllievo } from '@/app/trainer/actions'
import {
  eliminaBozzaScheda,
  improntaScheda,
  leggiBozzaScheda,
  ripulisciBozzeSchedeScadute,
  salvaBozzaScheda,
  type BozzaScheda,
} from '@/lib/bozza-scheda'
import {
  bloccoDi,
  creaGruppo,
  nomeGruppo,
  normalizzaGruppi,
  sciogliGruppo,
  spostaBlocco,
  spostaNelGruppo,
} from '@/lib/gruppi'
import type { Giorno } from '@/lib/scheda-tipi'
import {
  campiRipSerie,
  nuovaVoceForm,
  testoRipSerie,
  voceFormDaEsercizio,
  vocePerInvio,
  type VoceForm,
} from '@/lib/scheda-form'
import { categoriaDa, etichettaCategoria } from '@/lib/categorie'
import type { VoceElenco } from '@/lib/tipi'
import { CreaSuperSerie } from './CreaSuperSerie'
import { ElencoEsercizi } from './ElencoEsercizi'
import { FinestraConferma } from './FinestraConferma'
import { ImmagineEsercizio } from './ImmagineEsercizio'
import { IconaCestino, IconaGiu, IconaSu } from './icone'
import { IstruzioniEsercizio } from './IstruzioniEsercizio'
import { stileBottoneChiaro, stileBottonePrimario, stileCarta, stileInput, stileTesto } from './stili'

// `utenteId` è l'account per cui la pagina è stata disegnata (chi sta modificando). Se a modificare è un personal trainer,
// `allievoId` è l'utente di cui è la scheda e `base` la pagina a cui tornare (/trainer/12); altrimenti si modifica la propria.
// `versione` è il momento dell'ultima modifica letto dalla pagina: il server rifiuta il salvataggio se nel frattempo è cambiata.
type Props = {
  utenteId: number
  giorno: Giorno
  elenco: VoceElenco[]
  allievoId?: number
  base?: string
}

export function EditorScheda({ utenteId, giorno, elenco, allievoId, base = '/scheda' }: Props) {
  const router = useRouter()
  // Di chi è la scheda: la propria, oppure quella dell'allievo se a modificarla è il suo personal trainer.
  const proprietarioId = allievoId ?? utenteId
  const [titolo, setTitolo] = useState(giorno.titolo)
  const [voci, setVoci] = useState<VoceForm[]>(() => giorno.esercizi.map(voceFormDaEsercizio))
  const [sceltaAperta, setSceltaAperta] = useState(false)
  // Per ogni esercizio, quale dei due pannelli delle ripetizioni è aperto («serie fisse» o «serie piramidale»). All'inizio sono
  // tutti chiusi: i valori ci sono comunque (3 × 8-10 per un esercizio nuovo, quelli salvati per gli altri), si vedono solo toccando
  // un tasto. Non fa parte della scheda: non va nella bozza.
  const [aperte, setAperte] = useState<Record<string, 'fisse' | 'piramidale'>>({})
  const [errore, setErrore] = useState<string | null>(null)
  const [inCorso, startTransition] = useTransition()

  // La bozza. `salvata` è la scheda com'è nel database quando si apre l'editor, e `versione` il suo ultimo momento di modifica:
  // servono a capire se c'è qualcosa da non perdere e se la bozza è ancora attuale. Si calcolano una volta sola.
  const [salvata] = useState(() => improntaScheda(giorno.titolo, giorno.esercizi.map(voceFormDaEsercizio)))
  const [versione] = useState(() => giorno.modificata?.il ?? null)
  const [bozzaPronta, setBozzaPronta] = useState(false)
  // 'ripresa': le modifiche non salvate sono state rimesse. 'conflitto': la scheda è cambiata da quando le avevi scritte, e la
  // bozza aspetta una scelta (daConfrontare) invece di essere applicata in silenzio.
  const [avviso, setAvviso] = useState<'ripresa' | 'conflitto' | null>(null)
  const [daConfrontare, setDaConfrontare] = useState<BozzaScheda | null>(null)
  const [conferma, setConferma] = useState<'annulla' | 'ricomincia' | null>(null)
  // Dopo un salvataggio o un annullamento voluti la bozza non deve più essere scritta.
  const chiuso = useRef(false)

  const modificata = improntaScheda(titolo, voci) !== salvata

  // All'apertura riprende la bozza di questa giornata, se c'è: si legge qui e non nello stato iniziale perché il server non ha
  // il localStorage e le due versioni della pagina non coinciderebbero.
  useEffect(() => {
    ripulisciBozzeSchedeScadute()
    const bozza = leggiBozzaScheda(utenteId, proprietarioId, giorno.id)
    if (bozza) {
      if (improntaScheda(bozza.titolo, bozza.voci) === salvata) {
        // Uguale alla scheda salvata: non c'è niente da tenere.
        eliminaBozzaScheda(utenteId, proprietarioId, giorno.id)
      } else if (bozza.versione === versione) {
        setTitolo(bozza.titolo)
        setVoci(bozza.voci)
        setAvviso('ripresa')
      } else {
        setDaConfrontare(bozza)
        setAvviso('conflitto')
      }
    }
    setBozzaPronta(true)
    // La bozza si legge una volta sola all'apertura.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [utenteId, proprietarioId, giorno.id])

  // A ogni modifica la bozza si riscrive; se la scheda torna uguale a quella salvata, la bozza non serve più. Finché c'è da
  // scegliere cosa fare di una bozza vecchia non si scrive niente, per non cancellarla.
  useEffect(() => {
    if (!bozzaPronta || chiuso.current || avviso === 'conflitto') return
    if (!modificata) eliminaBozzaScheda(utenteId, proprietarioId, giorno.id)
    else salvaBozzaScheda(utenteId, proprietarioId, giorno.id, { titolo, voci, versione })
  }, [bozzaPronta, avviso, modificata, titolo, voci, versione, utenteId, proprietarioId, giorno.id])

  function riparti() {
    setTitolo(giorno.titolo)
    setVoci(giorno.esercizi.map(voceFormDaEsercizio))
    eliminaBozzaScheda(utenteId, proprietarioId, giorno.id)
    setAvviso(null)
    setErrore(null)
    setConferma(null)
  }

  function usaBozzaVecchia() {
    if (!daConfrontare) return
    setTitolo(daConfrontare.titolo)
    setVoci(daConfrontare.voci)
    setDaConfrontare(null)
    setAvviso('ripresa')
  }

  function tieniSalvata() {
    eliminaBozzaScheda(utenteId, proprietarioId, giorno.id)
    setDaConfrontare(null)
    setAvviso(null)
  }

  function esci() {
    chiuso.current = true
    eliminaBozzaScheda(utenteId, proprietarioId, giorno.id)
    router.push(`${base}?r=${giorno.id}`)
  }

  // Gli esercizi già in questa giornata non si propongono di nuovo.
  const esclusi = new Set(
    voci.flatMap((v) => [
      ...(v.esercizioId !== null ? [`e${v.esercizioId}`] : []),
      ...(v.catalogoId !== null ? [`c${v.catalogoId}`] : []),
      ...(v.catalogoRif !== null ? [`c${v.catalogoRif}`] : []),
    ]),
  )

  function modifica(chiave: string, patch: Partial<VoceForm>) {
    setVoci((prec) => prec.map((v) => (v.chiave === chiave ? { ...v, ...patch } : v)))
  }

  // Un esercizio singolo, o un intero gruppo, sale o scende di un posto: un esercizio singolo non entra mai in mezzo a un gruppo.
  function sposta(indice: number, verso: -1 | 1) {
    setVoci((prec) => spostaBlocco(prec, indice, verso))
  }

  // Dentro un gruppo gli esercizi si scambiano di posto, ma non escono dal gruppo.
  function spostaDentro(indice: number, verso: -1 | 1) {
    setVoci((prec) => spostaNelGruppo(prec, indice, verso))
  }

  // Togliere un esercizio da un gruppo: se il gruppo scende sotto i due esercizi si scioglie da solo.
  function togli(chiave: string) {
    setVoci((prec) => normalizzaGruppi(prec.filter((v) => v.chiave !== chiave)))
  }

  function sciogli(indice: number) {
    // Tolto il gruppo, ogni esercizio torna ad avere il suo recupero (quello scritto prima di metterlo nel gruppo).
    setVoci((prec) =>
      sciogliGruppo(prec, indice).map((voce, i) => (prec[i].gruppo !== null && voce.gruppo === null ? { ...voce, recuperoGruppo: '' } : voce)),
    )
  }

  // Il recupero del gruppo si cambia su tutti i suoi esercizi insieme.
  function cambiaRecuperoGruppo(indice: number, valore: string) {
    setVoci((prec) => {
      const blocco = bloccoDi(prec, indice)
      if (!blocco) return prec
      return prec.map((voce, i) => (i >= blocco.da && i < blocco.da + blocco.quanti ? { ...voce, recuperoGruppo: valore } : voce))
    })
  }

  function creaSuperSerie(chiavi: string[], recuperoSec: string) {
    setVoci((prec) => {
      const scelti = chiavi.flatMap((chiave) => {
        const i = prec.findIndex((v) => v.chiave === chiave)
        return i === -1 ? [] : [i]
      })
      const nuove = creaGruppo(prec, scelti, (voce) => ({ ...voce, gruppo: 9999, recuperoGruppo: recuperoSec }))
      return nuove ?? prec
    })
    setErrore(null)
  }

  // Un tasto delle ripetizioni: apre il suo pannello, e se è già aperto lo chiude. Aprendolo si porta l'esercizio in quel modo solo se
  // serve: riaprire un pannello non cancella quello che c'era scritto.
  function alternaRip(chiave: string, modo: 'fisse' | 'piramidale') {
    if (aperte[chiave] === modo) {
      setAperte((prec) => {
        const resto = { ...prec }
        delete resto[chiave]
        return resto
      })
      return
    }
    setAperte((prec) => ({ ...prec, [chiave]: modo }))
    const voce = voci.find((v) => v.chiave === chiave)
    if (!voce) return
    if (modo === 'piramidale' && voce.ripSerie === '') passaARipDiverse(chiave)
    if (modo === 'fisse' && voce.ripSerie !== '') passaARipUguali(chiave)
  }

  // Le ripetizioni: si passa da «serie fisse» (le stesse per tutte le serie) a «serie piramidale» (una per ogni serie) e viceversa.
  function passaARipDiverse(chiave: string) {
    setVoci((prec) =>
      prec.map((v) => {
        if (v.chiave !== chiave) return v
        // Si parte da un valore per serie, tutti uguali al massimo di adesso: poi si cambiano uno per uno.
        const quante = campiRipSerie({ ripSerie: '', serie: v.serie }).length
        return { ...v, ripSerie: testoRipSerie(Array.from({ length: quante }, () => v.ripMax.trim() || v.ripMin.trim())) }
      }),
    )
  }

  function passaARipUguali(chiave: string) {
    setVoci((prec) =>
      prec.map((v) => {
        if (v.chiave !== chiave) return v
        // Il minimo e il massimo vengono dai valori scritti, se sono numeri.
        const valori = campiRipSerie(v).map((testo) => Number.parseInt(testo, 10)).filter((n) => Number.isInteger(n) && n >= 1)
        if (valori.length === 0) return { ...v, ripSerie: '' }
        return { ...v, ripSerie: '', ripMin: String(Math.min(...valori)), ripMax: String(Math.max(...valori)) }
      }),
    )
  }

  function cambiaRipSerie(chiave: string, indiceSerie: number, valore: string) {
    setVoci((prec) =>
      prec.map((v) => {
        if (v.chiave !== chiave) return v
        const campi = campiRipSerie(v)
        campi[indiceSerie] = valore.replace(/[^\d]/g, '').slice(0, 3)
        return { ...v, ripSerie: testoRipSerie(campi) }
      }),
    )
  }

  function aggiungiDallElenco(scelto: VoceElenco) {
    setVoci((prec) => [...prec, nuovaVoceForm(`elenco-${scelto.chiave}`, scelto)])
    setErrore(null)
  }

  function salva() {
    setErrore(null)
    const convertite = voci.map(vocePerInvio)
    const sbagliata = convertite.find((voce): voce is { errore: string } => 'errore' in voce)
    if (sbagliata) {
      const indiceSbagliata = convertite.findIndex((voce) => 'errore' in voce)
      const voceSbagliata = voci[indiceSbagliata]
      if (voceSbagliata) {
        setAperte((prec) => ({ ...prec, [voceSbagliata.chiave]: voceSbagliata.ripSerie !== '' ? 'piramidale' : 'fisse' }))
      }
      return setErrore(sbagliata.errore)
    }

    startTransition(async () => {
      const scheda = { giornoId: giorno.id, titolo, voci: convertite }
      const versione = giorno.modificata?.il ?? null
      const esito =
        allievoId === undefined
          ? await salvaScheda(utenteId, scheda, versione)
          : await salvaSchedaAllievo(utenteId, allievoId, scheda, versione)
      if ('errore' in esito) return setErrore(esito.errore)
      // Salvata: la bozza non serve più (e se il salvataggio fallisce resta, per riprovare senza riscrivere).
      chiuso.current = true
      eliminaBozzaScheda(utenteId, proprietarioId, giorno.id)
      router.push(`${base}?r=${giorno.id}`)
      router.refresh()
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-extrabold tracking-tight">Personalizza {giorno.id}</h1>
        <button
          type="button"
          // Con modifiche non salvate si chiede conferma: uscire per sbaglio è proprio il caso da evitare.
          onClick={() => (modificata ? setConferma('annulla') : esci())}
          className={stileBottoneChiaro}
        >
          Annulla
        </button>
      </div>

      {/* La bozza è stata rimessa: si dice, e si può ricominciare dalla scheda salvata. */}
      {avviso === 'ripresa' && (
        <section role="status" className="space-y-2 rounded-2xl bg-ok/10 p-3 text-sm">
          <p className="font-semibold text-testo">Ho ripreso le modifiche che non avevi salvato.</p>
          <p className="text-muto">Premi «Salva scheda» per tenerle. Se non le vuoi, ricomincia dalla scheda salvata.</p>
          <button type="button" onClick={() => setConferma('ricomincia')} className={stileBottoneChiaro}>
            Ricomincia dalla scheda salvata
          </button>
        </section>
      )}

      {/* La scheda è cambiata dopo che hai scritto la bozza (per esempio l'ha modificata il tuo personal trainer): non si
          sovrascrive niente di nascosto, si sceglie. */}
      {avviso === 'conflitto' && (
        <section role="alert" className="space-y-2 rounded-2xl bg-attenzione/15 p-3 text-sm">
          <p className="font-semibold text-testo">Questa giornata è cambiata da quando avevi iniziato a modificarla.</p>
          <p className="text-muto">
            Hai delle modifiche non salvate, scritte sulla scheda di prima. Se le riprendi, salvando sostituisci la scheda attuale.
          </p>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={tieniSalvata} className={stileBottoneChiaro}>
              Usa la scheda attuale
            </button>
            <button type="button" onClick={usaBozzaVecchia} className={stileBottoneChiaro}>
              Riprendi le mie modifiche
            </button>
          </div>
        </section>
      )}

      <section className={`${stileCarta} space-y-3 p-4`}>
        <label className="block space-y-1 text-sm text-muto">
          <span>Titolo</span>
          <input value={titolo} maxLength={60} onChange={(e) => setTitolo(e.target.value)} className={`${stileTesto} text-left`} />
        </label>
      </section>

      {/* In alto, prima dell'elenco: si scelgono gli esercizi da mettere insieme e si crea il superset, il triset o il gigantset. */}
      <CreaSuperSerie voci={voci} alCrea={creaSuperSerie} />

      <ul className="space-y-3">
        {voci.map((voce, indice) => {
          const blocco = bloccoDi(voci, indice)
          const posizione = blocco ? indice - blocco.da : 0
          const èPrimo = blocco !== null && posizione === 0
          const èUltimo = blocco !== null && posizione === blocco.quanti - 1
          const nome = blocco ? nomeGruppo(blocco.quanti) : null
          return (
          <li
            key={voce.chiave}
            // Gli esercizi di una super serie sono vicini, con una barra a sinistra che li tiene insieme (e che si legge anche
            // senza colori: c'è anche il nome e il «1/2»).
            className={`${stileCarta} space-y-3 p-4 ${blocco ? 'border-l-4 border-l-accento' : ''} ${
              blocco && !èUltimo ? 'rounded-b-none' : ''
            } ${blocco && !èPrimo ? '-mt-3 rounded-t-none border-t-0' : ''}`}
            aria-label={blocco ? `${nome} ${posizione + 1} di ${blocco.quanti}: ${voce.nome}` : undefined}
          >
            {blocco && (
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="rounded-full bg-accento/15 px-2.5 py-1 text-xs font-extrabold text-accento">
                  {nome} · {posizione + 1}/{blocco.quanti}
                </span>
                {èPrimo && (
                  <span className="flex items-center gap-1.5">
                    <button
                      type="button"
                      aria-label={`Sposta su l'intero ${nome?.toLowerCase()}`}
                      disabled={indice === 0}
                      onClick={() => sposta(indice, -1)}
                      className={`${stileBottoneChiaro} touch-manipulation !px-3 !py-1.5 text-xs`}
                    >
                      <IconaSu className="size-3.5" />
                      Gruppo
                    </button>
                    <button
                      type="button"
                      aria-label={`Sposta giù l'intero ${nome?.toLowerCase()}`}
                      disabled={blocco.da + blocco.quanti >= voci.length}
                      onClick={() => sposta(indice, 1)}
                      className={`${stileBottoneChiaro} touch-manipulation !px-3 !py-1.5 text-xs`}
                    >
                      <IconaGiu className="size-3.5" />
                      Gruppo
                    </button>
                  </span>
                )}
              </div>
            )}
            <div className="flex items-start justify-between gap-2">
              <ImmagineEsercizio src={voce.immagine} nome={voce.nome} className="size-16" />
              <div className="min-w-0 flex-1">
                <h2 className="text-lg font-extrabold leading-tight">{voce.nome}</h2>
                {voce.nomeEn !== '' && <p className="text-xs text-muto">{voce.nomeEn}</p>}
              </div>
              <div className="flex shrink-0 gap-1.5">
                {blocco ? (
                  <>
                    <button type="button" aria-label={`Sposta su ${voce.nome} nel gruppo`} disabled={posizione === 0} onClick={() => spostaDentro(indice, -1)} className={`${stileBottoneChiaro} size-10 touch-manipulation !p-0`}>
                      <IconaSu className="size-4" />
                    </button>
                    <button type="button" aria-label={`Sposta giù ${voce.nome} nel gruppo`} disabled={èUltimo} onClick={() => spostaDentro(indice, 1)} className={`${stileBottoneChiaro} size-10 touch-manipulation !p-0`}>
                      <IconaGiu className="size-4" />
                    </button>
                  </>
                ) : (
                  <>
                    <button type="button" aria-label={`Sposta su ${voce.nome}`} disabled={indice === 0} onClick={() => sposta(indice, -1)} className={`${stileBottoneChiaro} size-10 touch-manipulation !p-0`}>
                      <IconaSu className="size-4" />
                    </button>
                    <button type="button" aria-label={`Sposta giù ${voce.nome}`} disabled={indice === voci.length - 1} onClick={() => sposta(indice, 1)} className={`${stileBottoneChiaro} size-10 touch-manipulation !p-0`}>
                      <IconaGiu className="size-4" />
                    </button>
                  </>
                )}
                <button
                  type="button"
                  aria-label={`Togli ${voce.nome} dalla giornata`}
                  onClick={() => togli(voce.chiave)}
                  className="grid size-10 touch-manipulation place-items-center rounded-xl bg-errore/10 text-errore"
                >
                  <IconaCestino className="size-4" />
                </button>
              </div>
            </div>

            {/* La categoria è quella del catalogo: si mostra, non si cambia. */}
            {categoriaDa(voce.categoria) && (
              <p className="text-sm text-muto">
                Categoria: <span className="font-semibold text-testo">{etichettaCategoria(categoriaDa(voce.categoria)!)}</span>
              </p>
            )}

            <IstruzioniEsercizio catalogoId={voce.catalogoId ?? voce.catalogoRif} esercizioId={voce.esercizioId} nome={voce.nome} />

            {/* Le ripetizioni. Due tasti, spenti all'inizio: toccandone uno compaiono i suoi campi (serie e recupero, poi le
                ripetizioni), toccandolo di nuovo si richiudono. «Serie fisse»: un minimo e un massimo, uguali per tutte le serie.
                «Serie piramidale»: una casella per ogni serie (12, 10, 8, 6 a scendere; 6, 8, 10, 12 a salire). Finché sono chiusi
                le ripetizioni restano quelle che l'esercizio ha già, e una riga le riassume. */}
            <fieldset className="space-y-3">
              <legend className="mb-1 text-sm text-muto">Ripetizioni</legend>
              <div className="grid grid-cols-2 gap-2">
                {(
                  [
                    { modo: 'fisse', titolo: 'Serie fisse' },
                    { modo: 'piramidale', titolo: 'Serie piramidale' },
                  ] as const
                ).map((opzione) => {
                  const aperto = aperte[voce.chiave] === opzione.modo
                  return (
                    <button
                      key={opzione.modo}
                      type="button"
                      aria-pressed={aperto}
                      aria-expanded={aperto}
                      aria-controls={aperto ? `rip-${voce.chiave}` : undefined}
                      onClick={() => alternaRip(voce.chiave, opzione.modo)}
                      className={`flex min-h-12 touch-manipulation items-center justify-center rounded-2xl border px-2 py-2 text-center text-[13px] leading-tight font-extrabold tracking-wide uppercase transition active:opacity-80 ${
                        aperto ? 'border-accento bg-accento/10 text-testo' : 'border-bordo bg-fondo text-muto'
                      }`}
                    >
                      {opzione.titolo}
                    </button>
                  )
                })}
              </div>

              {aperte[voce.chiave] === undefined ? (
                <p className="text-sm text-muto">
                  Ora: <span className="font-semibold text-testo">{riepilogoRip(voce, blocco !== null)}</span>. Tocca un tasto per cambiare.
                </p>
              ) : (
                <div id={`rip-${voce.chiave}`} className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <Numero etichetta="Serie" valore={voce.serie} alCambio={(v) => modifica(voce.chiave, { serie: v })} />
                    {blocco ? (
                      <div className="space-y-1 text-sm text-muto">
                        <span className="block">Recupero</span>
                        <p className="rounded-2xl bg-carta-alta px-3 py-3 text-xs">Senza pausa: vale il recupero del gruppo</p>
                      </div>
                    ) : (
                      <Numero etichetta="Recupero (s)" valore={voce.recuperoSec} alCambio={(v) => modifica(voce.chiave, { recuperoSec: v })} />
                    )}
                  </div>

                  {aperte[voce.chiave] === 'fisse' ? (
                    <>
                      <div className="grid grid-cols-2 gap-3">
                        <Numero etichetta="Rip. min" valore={voce.ripMin} alCambio={(v) => modifica(voce.chiave, { ripMin: v })} />
                        <Numero etichetta="Rip. max" valore={voce.ripMax} alCambio={(v) => modifica(voce.chiave, { ripMax: v })} />
                      </div>
                      <p className="text-xs text-muto">Lo stesso minimo e massimo per tutte le serie, per esempio 8 e 10.</p>
                    </>
                  ) : (
                    <>
                      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                        {campiRipSerie(voce).map((valore, i) => (
                          <Numero
                            key={i}
                            etichetta={`Rip. ${i + 1}`}
                            valore={valore}
                            alCambio={(v) => cambiaRipSerie(voce.chiave, i, v)}
                          />
                        ))}
                      </div>
                      <p className="text-xs text-muto">Una casella per ogni serie, per esempio 12, 10, 8, 6 (a scendere) oppure 6, 8, 10, 12 (a salire).</p>
                    </>
                  )}
                </div>
              )}
            </fieldset>

            {/* Il gruppo: il nome, il recupero (uguale per tutti gli esercizi) e come scioglierlo. Sta nell'ultimo esercizio. */}
            {blocco && èUltimo && (
              <div className="space-y-2 rounded-2xl bg-accento/10 p-3">
                <Numero
                  etichetta={`Recupero del ${nome?.toLowerCase()} (s), dopo ogni giro`}
                  valore={voce.recuperoGruppo}
                  alCambio={(v) => cambiaRecuperoGruppo(indice, v)}
                />
                <button type="button" onClick={() => sciogli(indice)} className={`${stileBottoneChiaro} touch-manipulation w-full`}>
                  Sciogli il {nome?.toLowerCase()}
                </button>
              </div>
            )}

            <label className="block space-y-1 text-sm text-muto">
              <span>Nota (facoltativa)</span>
              <input value={voce.nota} maxLength={120} onChange={(e) => modifica(voce.chiave, { nota: e.target.value })} className={`${stileTesto} text-left`} />
            </label>

            <Numero
              etichetta="Carico a salire di (kg), vuoto = no"
              valore={voce.incrementoKg}
              decimale
              alCambio={(v) => modifica(voce.chiave, { incrementoKg: v })}
            />
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
        <p className="text-xs text-muto">Gli esercizi si scelgono solo dall&apos;elenco: se ne manca uno, va aggiunto al catalogo.</p>
      </section>

      {errore && (
        <p role="alert" className="rounded-xl bg-errore/10 p-3 text-sm text-errore">
          {errore}
        </p>
      )}

      <p className="text-xs text-muto">Le sedute già salvate non cambiano: la modifica vale dalla prossima sessione.</p>

      <button type="button" onClick={salva} disabled={inCorso} className={stileBottonePrimario}>
        {inCorso ? 'Salvataggio…' : 'Salva scheda'}
      </button>

      <FinestraConferma
        aperta={conferma === 'annulla'}
        titolo="Uscire senza salvare?"
        testoConferma="Esci e butta le modifiche"
        testoAnnulla="Resta qui"
        pericolo
        alConferma={esci}
        alAnnulla={() => setConferma(null)}
      >
        <p>Le modifiche che hai fatto a questa giornata andranno perse.</p>
      </FinestraConferma>

      <FinestraConferma
        aperta={conferma === 'ricomincia'}
        titolo="Ricominciare dalla scheda salvata?"
        testoConferma="Ricomincia"
        testoAnnulla="Tieni le modifiche"
        pericolo
        alConferma={riparti}
        alAnnulla={() => setConferma(null)}
      >
        <p>Le modifiche non salvate andranno perse.</p>
      </FinestraConferma>
    </div>
  )
}

// Le ripetizioni di un esercizio a parole, per quando il pannello è chiuso: «3 × 8-10 · recupero 90 s», «4 × 12-10-8-6 · senza pausa».
function riepilogoRip(voce: VoceForm, inGruppo: boolean): string {
  const min = voce.ripMin.trim()
  const max = voce.ripMax.trim()
  const rip =
    voce.ripSerie !== ''
      ? campiRipSerie(voce)
          .map((valore) => valore || '?')
          .join('-')
      : max === '' || max === min
        ? min || '?'
        : `${min || '?'}-${max}`
  const recupero = inGruppo ? 'senza pausa' : `recupero ${voce.recuperoSec.trim() || '?'} s`
  return `${voce.serie.trim() || '?'} × ${rip} · ${recupero}`
}

function Numero(props: { etichetta: string; valore: string; alCambio: (valore: string) => void; decimale?: boolean }) {
  return (
    <label className="block space-y-1 text-sm text-muto">
      <span>{props.etichetta}</span>
      <input
        inputMode={props.decimale ? 'decimal' : 'numeric'}
        value={props.valore}
        onChange={(e) => props.alCambio(e.target.value)}
        className={stileInput}
      />
    </label>
  )
}
