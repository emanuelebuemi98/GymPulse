'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { salvaScheda } from '@/app/actions'
import type { Giorno } from '@/lib/scheda-tipi'
import {
  nuovaVoceForm,
  voceFormDaEsercizio,
  vocePerInvio,
  type TipoVoce,
  type VoceForm,
} from '@/lib/scheda-form'
import type { VoceCatalogo } from '@/lib/tipi'
import { IconaCestino, IconaGiu, IconaPiu, IconaSu } from './icone'
import { stileBottoneChiaro, stileBottonePrimario, stileCarta, stileInput, stileTesto } from './stili'

type Props = { giorno: Giorno; catalogo: VoceCatalogo[] }

const etichetteTipo: Record<TipoVoce, string> = {
  serie: 'Serie × ripetizioni',
  totale: 'Ripetizioni totali',
  libero: 'Serie a scelta',
}

export function EditorScheda({ giorno, catalogo }: Props) {
  const router = useRouter()
  const [titolo, setTitolo] = useState(giorno.titolo)
  const [focus, setFocus] = useState(giorno.focus)
  const [voci, setVoci] = useState<VoceForm[]>(() => giorno.esercizi.map(voceFormDaEsercizio))
  const [aggiunta, setAggiunta] = useState('')
  const [nomeLibero, setNomeLibero] = useState('')
  const [errore, setErrore] = useState<string | null>(null)
  const [inCorso, startTransition] = useTransition()
  const [contatore, setContatore] = useState(0)

  const disponibili = catalogo.filter((voce) => !voci.some((v) => v.esercizioId === voce.id))

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

  function aggiungiDalCatalogo() {
    const scelto = catalogo.find((voce) => voce.id === aggiunta)
    if (!scelto) return
    setVoci((prec) => [...prec, nuovaVoceForm(`catalogo-${scelto.id}`, { esercizioId: scelto.id, nome: scelto.nome })])
    setAggiunta('')
  }

  function aggiungiLibero() {
    const nome = nomeLibero.trim()
    if (nome === '') return
    if (voci.some((v) => v.nome.toLowerCase() === nome.toLowerCase())) {
      setErrore(`${nome} è già in questa giornata`)
      return
    }
    setErrore(null)
    const esistente = catalogo.find((voce) => voce.nome.toLowerCase() === nome.toLowerCase())
    setContatore((n) => n + 1)
    setVoci((prec) => [
      ...prec,
      nuovaVoceForm(
        `nuovo-${contatore}`,
        esistente ? { esercizioId: esistente.id, nome: esistente.nome } : { nomeNuovo: nome },
      ),
    ])
    setNomeLibero('')
  }

  function salva() {
    setErrore(null)
    const convertite = voci.map(vocePerInvio)
    const sbagliata = convertite.find((voce): voce is { errore: string } => 'errore' in voce)
    if (sbagliata) return setErrore(sbagliata.errore)

    startTransition(async () => {
      const esito = await salvaScheda({ giornoId: giorno.id, titolo, focus, voci: convertite })
      if ('errore' in esito) return setErrore(esito.errore)
      router.push(`/scheda?r=${giorno.id}`)
      router.refresh()
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-extrabold tracking-tight">Personalizza {giorno.id}</h1>
        <button type="button" onClick={() => router.push(`/scheda?r=${giorno.id}`)} className={stileBottoneChiaro}>
          Annulla
        </button>
      </div>

      <section className={`${stileCarta} space-y-3 p-4`}>
        <label className="block space-y-1 text-sm text-muto">
          <span>Titolo</span>
          <input value={titolo} maxLength={60} onChange={(e) => setTitolo(e.target.value)} className={`${stileTesto} text-left`} />
        </label>
        <label className="block space-y-1 text-sm text-muto">
          <span>Focus (facoltativo)</span>
          <input value={focus} maxLength={80} onChange={(e) => setFocus(e.target.value)} className={`${stileTesto} text-left`} />
        </label>
      </section>

      <ul className="space-y-3">
        {voci.map((voce, indice) => (
          <li key={voce.chiave} className={`${stileCarta} space-y-3 p-4`}>
            <div className="flex items-start justify-between gap-2">
              <h2 className="min-w-0 text-lg font-extrabold leading-tight">{voce.nome}</h2>
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
        <div className="grid grid-cols-[1fr_auto] gap-2">
          <select value={aggiunta} onChange={(e) => setAggiunta(e.target.value)} className={`${stileTesto} text-left`}>
            <option value="">Dalle routine…</option>
            {disponibili.map((voce) => (
              <option key={voce.id} value={voce.id}>
                {voce.nome}
              </option>
            ))}
          </select>
          <button type="button" aria-label="Aggiungi l'esercizio scelto" disabled={aggiunta === ''} onClick={aggiungiDalCatalogo} className={`${stileBottoneChiaro} px-4`}>
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
