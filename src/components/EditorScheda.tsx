'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { salvaScheda } from '@/app/actions'
import { salvaSchedaAllievo } from '@/app/trainer/actions'
import type { Giorno } from '@/lib/scheda-tipi'
import {
  nuovaVoceForm,
  voceFormDaEsercizio,
  vocePerInvio,
  type TipoVoce,
  type VoceForm,
} from '@/lib/scheda-form'
import { categoriaDa, etichettaCategoria } from '@/lib/categorie'
import type { VoceElenco } from '@/lib/tipi'
import { ElencoEsercizi } from './ElencoEsercizi'
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

const etichetteTipo: Record<TipoVoce, string> = {
  serie: 'Serie × ripetizioni',
  totale: 'Ripetizioni totali',
  libero: 'Serie a scelta',
}

export function EditorScheda({ utenteId, giorno, elenco, allievoId, base = '/scheda' }: Props) {
  const router = useRouter()
  const [titolo, setTitolo] = useState(giorno.titolo)
  const [voci, setVoci] = useState<VoceForm[]>(() => giorno.esercizi.map(voceFormDaEsercizio))
  const [sceltaAperta, setSceltaAperta] = useState(false)
  const [errore, setErrore] = useState<string | null>(null)
  const [inCorso, startTransition] = useTransition()

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

  function sposta(indice: number, verso: -1 | 1) {
    setVoci((prec) => {
      const destinazione = indice + verso
      if (destinazione < 0 || destinazione >= prec.length) return prec
      const copia = [...prec]
      ;[copia[indice], copia[destinazione]] = [copia[destinazione], copia[indice]]
      return copia
    })
  }

  function aggiungiDallElenco(scelto: VoceElenco) {
    setVoci((prec) => [...prec, nuovaVoceForm(`elenco-${scelto.chiave}`, scelto)])
    setErrore(null)
  }

  function salva() {
    setErrore(null)
    const convertite = voci.map(vocePerInvio)
    const sbagliata = convertite.find((voce): voce is { errore: string } => 'errore' in voce)
    if (sbagliata) return setErrore(sbagliata.errore)

    startTransition(async () => {
      const scheda = { giornoId: giorno.id, titolo, voci: convertite }
      const versione = giorno.modificata?.il ?? null
      const esito =
        allievoId === undefined
          ? await salvaScheda(utenteId, scheda, versione)
          : await salvaSchedaAllievo(utenteId, allievoId, scheda, versione)
      if ('errore' in esito) return setErrore(esito.errore)
      router.push(`${base}?r=${giorno.id}`)
      router.refresh()
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-extrabold tracking-tight">Personalizza {giorno.id}</h1>
        <button type="button" onClick={() => router.push(`${base}?r=${giorno.id}`)} className={stileBottoneChiaro}>
          Annulla
        </button>
      </div>

      <section className={`${stileCarta} space-y-3 p-4`}>
        <label className="block space-y-1 text-sm text-muto">
          <span>Titolo</span>
          <input value={titolo} maxLength={60} onChange={(e) => setTitolo(e.target.value)} className={`${stileTesto} text-left`} />
        </label>
      </section>

      <ul className="space-y-3">
        {voci.map((voce, indice) => (
          <li key={voce.chiave} className={`${stileCarta} space-y-3 p-4`}>
            <div className="flex items-start justify-between gap-2">
              <ImmagineEsercizio src={voce.immagine} nome={voce.nome} className="size-16" />
              <div className="min-w-0 flex-1">
                <h2 className="text-lg font-extrabold leading-tight">{voce.nome}</h2>
                {voce.nomeEn !== '' && <p className="text-xs text-muto">{voce.nomeEn}</p>}
              </div>
              <div className="flex shrink-0 gap-1.5">
                <button type="button" aria-label={`Sposta su ${voce.nome}`} disabled={indice === 0} onClick={() => sposta(indice, -1)} className={`${stileBottoneChiaro} size-10 !p-0`}>
                  <IconaSu className="size-4" />
                </button>
                <button type="button" aria-label={`Sposta giù ${voce.nome}`} disabled={indice === voci.length - 1} onClick={() => sposta(indice, 1)} className={`${stileBottoneChiaro} size-10 !p-0`}>
                  <IconaGiu className="size-4" />
                </button>
                <button
                  type="button"
                  aria-label={`Togli ${voce.nome} dalla giornata`}
                  onClick={() => setVoci((prec) => prec.filter((v) => v.chiave !== voce.chiave))}
                  className="grid size-10 place-items-center rounded-xl bg-errore/10 text-errore"
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

            <label className="block space-y-1 text-sm text-muto">
              <span>Tipo di obiettivo</span>
              <select value={voce.tipo} onChange={(e) => modifica(voce.chiave, { tipo: e.target.value as TipoVoce })} className={`${stileTesto} text-left`}>
                {(Object.keys(etichetteTipo) as TipoVoce[]).map((tipo) => (
                  <option key={tipo} value={tipo}>
                    {etichetteTipo[tipo]}
                  </option>
                ))}
              </select>
            </label>

            {voce.tipo === 'serie' && (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <Numero etichetta="Serie" valore={voce.serie} alCambio={(v) => modifica(voce.chiave, { serie: v })} />
                <Numero etichetta="Rip. min" valore={voce.ripMin} alCambio={(v) => modifica(voce.chiave, { ripMin: v })} />
                <Numero etichetta="Rip. max" valore={voce.ripMax} alCambio={(v) => modifica(voce.chiave, { ripMax: v })} />
                <Numero etichetta="Recupero (s)" valore={voce.recuperoSec} alCambio={(v) => modifica(voce.chiave, { recuperoSec: v })} />
              </div>
            )}
            {voce.tipo === 'totale' && (
              <Numero etichetta="Ripetizioni totali" valore={voce.ripTotali} alCambio={(v) => modifica(voce.chiave, { ripTotali: v })} />
            )}
            {voce.tipo === 'libero' && (
              <div className="grid grid-cols-2 gap-3">
                <Numero etichetta="Serie min" valore={voce.serieMin} alCambio={(v) => modifica(voce.chiave, { serieMin: v })} />
                <Numero etichetta="Serie max" valore={voce.serieMax} alCambio={(v) => modifica(voce.chiave, { serieMax: v })} />
              </div>
            )}

            <label className="block space-y-1 text-sm text-muto">
              <span>Nota (facoltativa)</span>
              <input value={voce.nota} maxLength={120} onChange={(e) => modifica(voce.chiave, { nota: e.target.value })} className={`${stileTesto} text-left`} />
            </label>

            {voce.tipo === 'serie' && (
              <Numero
                etichetta="Carico a salire di (kg), vuoto = no"
                valore={voce.incrementoKg}
                decimale
                alCambio={(v) => modifica(voce.chiave, { incrementoKg: v })}
              />
            )}
          </li>
        ))}
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
    </div>
  )
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
