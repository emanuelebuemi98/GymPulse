import type { Esercizio } from './scheda-tipi'
import { parseIntero, parseNumero } from './numeri'
import type { VoceElenco } from './tipi'
import { RECUPERO_PREDEFINITO } from './voci'

// Una riga dell'editor della scheda: tutti i numeri sono testo, come nei campi del form.
// Un esercizio è già della persona (esercizioId) oppure preso dal catalogo e non ancora suo (catalogoId): uno solo dei due.
// Non si scrivono più a mano. C'è un solo tipo di obiettivo, «serie × ripetizioni»: le ripetizioni sono un minimo e un massimo
// uguali per tutte le serie («serie fisse»), oppure una per ogni serie («serie piramidale»).
export type VoceForm = {
  chiave: string
  esercizioId: number | null
  catalogoId: number | null
  // Il catalogo a cui l'esercizio è collegato, solo per mostrare «Come si fa»; non si invia al server.
  catalogoRif: number | null
  nome: string
  nomeEn: string
  immagine: string
  // La categoria dell'esercizio ('petto'), solo da mostrare: la dà il catalogo e non si cambia da qui.
  categoria: string
  serie: string
  ripMin: string
  ripMax: string
  recuperoSec: string
  nota: string
  incrementoKg: string
  // Le ripetizioni di ogni serie separate da virgola ("12,10,8,6"; un campo lasciato vuoto dà "12,,8,6"). Vuoto = le stesse per
  // tutte le serie (si usano ripMin e ripMax). Non vuoto = serie piramidale: ogni serie ha il suo valore.
  ripSerie: string
  // Il numero della super serie (superset, triset, gigantset) a cui appartiene, oppure nessuno. Gli esercizi con lo stesso numero
  // sono vicini. Il numero lo ridà `normalizzaGruppi` (src/lib/gruppi.ts) dopo ogni modifica.
  gruppo: number | null
  // Il recupero dopo ogni giro della super serie, scritto uguale su tutti i suoi esercizi; vuoto se non è in un gruppo.
  recuperoGruppo: string
}

export type VocePerInvio = {
  esercizioId: number | null
  catalogoId: number | null
  tipo: 'serie'
  serie: number | null
  ripMin: number | null
  ripMax: number | null
  recuperoSec: number | null
  nota: string | null
  incrementoKg: number | null
  ripSerie: number[] | null
  gruppo: number | null
  recuperoGruppoSec: number | null
}

const predefiniti = {
  serie: '3',
  ripMin: '8',
  ripMax: '10',
  recuperoSec: String(RECUPERO_PREDEFINITO),
  nota: '',
  incrementoKg: '',
  ripSerie: '',
  gruppo: null,
  recuperoGruppo: '',
}

export function voceFormDaEsercizio(esercizio: Esercizio): VoceForm {
  const o = esercizio.obiettivo
  return {
    ...predefiniti,
    chiave: `e${esercizio.id}`,
    esercizioId: esercizio.id,
    catalogoId: null,
    catalogoRif: esercizio.catalogoRif,
    nome: esercizio.nome,
    nomeEn: esercizio.nomeEn,
    immagine: esercizio.immagine,
    categoria: esercizio.categoria,
    serie: String(o.serie),
    ripMin: String(o.ripMin),
    ripMax: String(o.ripMax),
    recuperoSec: String(o.recuperoSec),
    ripSerie: o.ripSerie ? o.ripSerie.join(',') : '',
    nota: esercizio.nota ?? '',
    incrementoKg: esercizio.incrementoKg ? String(esercizio.incrementoKg) : '',
    gruppo: esercizio.gruppo?.numero ?? null,
    recuperoGruppo: esercizio.gruppo ? String(esercizio.gruppo.recuperoSec) : '',
  }
}

// Nuova riga per un esercizio scelto dall'elenco (della persona o del catalogo).
export function nuovaVoceForm(chiave: string, scelta: VoceElenco): VoceForm {
  return {
    ...predefiniti,
    chiave,
    esercizioId: scelta.id,
    catalogoId: scelta.id === null ? scelta.catalogoId : null,
    catalogoRif: scelta.catalogoId,
    nome: scelta.nome,
    nomeEn: scelta.nomeEn,
    immagine: scelta.immagine,
    categoria: scelta.categoria,
  }
}

const NON_VALIDO = Symbol('non valido')

function campo(testo: string, intero: boolean): number | null | typeof NON_VALIDO {
  if (testo.trim() === '') return null
  const valore = intero ? parseIntero(testo) : parseNumero(testo)
  return valore === null ? NON_VALIDO : valore
}

// I campi della serie piramidale: tanti quanti sono le serie. I valori in più (se si sono tolte serie dopo averli scritti) si
// tengono nel testo finché non si salva, ma non contano; quelli che mancano restano vuoti.
export function campiRipSerie(voce: Pick<VoceForm, 'ripSerie' | 'serie'>): string[] {
  const parti = voce.ripSerie.split(',')
  const serie = parseIntero(voce.serie)
  const quante = serie !== null && serie >= 1 && serie <= 20 ? serie : parti.length
  return Array.from({ length: quante }, (_, i) => (parti[i] ?? '').trim())
}

// Da un elenco di campi al testo salvato nel modulo ("12,,8,6"). Almeno un campo, anche vuoto, perché "non vuoto" vuol dire
// «serie piramidale».
export function testoRipSerie(campi: string[]): string {
  return campi.length === 0 ? ',' : campi.join(',')
}

// Dalla riga dell'editor ai dati da inviare al server.
export function vocePerInvio(voce: VoceForm): VocePerInvio | { errore: string } {
  const serie = campo(voce.serie, true)
  const ripMin = campo(voce.ripMin, true)
  const ripMax = campo(voce.ripMax, true)
  const recuperoSec = campo(voce.recuperoSec, true)
  const incrementoKg = campo(voce.incrementoKg, false)
  const recuperoGruppo = campo(voce.recuperoGruppo, true)

  const tutti = [serie, ripMin, ripMax, recuperoSec, incrementoKg, recuperoGruppo]
  if (tutti.some((valore) => valore === NON_VALIDO)) return { errore: `Controlla i numeri di ${voce.nome}` }

  const numero = (valore: number | null | typeof NON_VALIDO) => (valore === NON_VALIDO ? null : valore)

  // Serie piramidale: un valore intero per ogni serie.
  let ripSerie: number[] | null = null
  if (voce.ripSerie !== '') {
    const campi = campiRipSerie(voce).slice(0, numero(serie) ?? undefined)
    const valori = campi.map((testo) => campo(testo, true))
    if (valori.length === 0 || valori.some((valore) => valore === NON_VALIDO || valore === null)) {
      return { errore: `Scrivi le ripetizioni di ogni serie di ${voce.nome}` }
    }
    ripSerie = valori as number[]
  }

  return {
    esercizioId: voce.esercizioId,
    catalogoId: voce.catalogoId,
    tipo: 'serie',
    serie: numero(serie),
    ripMin: ripSerie ? Math.min(...ripSerie) : numero(ripMin),
    ripMax: ripSerie ? Math.max(...ripSerie) : numero(ripMax),
    recuperoSec: numero(recuperoSec),
    nota: voce.nota.trim() === '' ? null : voce.nota.trim(),
    incrementoKg: numero(incrementoKg),
    ripSerie,
    gruppo: voce.gruppo,
    recuperoGruppoSec: voce.gruppo !== null ? (numero(recuperoGruppo) ?? RECUPERO_PREDEFINITO) : null,
  }
}
