import type { Esercizio } from './scheda-tipi'
import { parseIntero, parseNumero } from './numeri'
import type { VoceElenco } from './tipi'
import { RECUPERO_PREDEFINITO } from './voci'

export type TipoVoce = 'serie' | 'totale' | 'libero'

// Una riga dell'editor della scheda: tutti i numeri sono testo, come nei campi del form.
// Un esercizio è già della persona (esercizioId) oppure preso dal catalogo e non ancora suo (catalogoId): uno solo dei due.
// Non si scrivono più a mano.
export type VoceForm = {
  chiave: string
  esercizioId: number | null
  catalogoId: number | null
  nome: string
  nomeEn: string
  // La categoria dell'esercizio ('petto'), solo da mostrare: la dà il catalogo e non si cambia da qui.
  categoria: string
  tipo: TipoVoce
  serie: string
  ripMin: string
  ripMax: string
  recuperoSec: string
  ripTotali: string
  serieMin: string
  serieMax: string
  nota: string
  incrementoKg: string
}

export type VocePerInvio = {
  esercizioId: number | null
  catalogoId: number | null
  tipo: TipoVoce
  serie: number | null
  ripMin: number | null
  ripMax: number | null
  recuperoSec: number | null
  ripTotali: number | null
  serieMin: number | null
  serieMax: number | null
  nota: string | null
  incrementoKg: number | null
}

const predefiniti = {
  serie: '3',
  ripMin: '8',
  ripMax: '10',
  recuperoSec: String(RECUPERO_PREDEFINITO),
  ripTotali: '50',
  serieMin: '3',
  serieMax: '4',
  nota: '',
  incrementoKg: '',
}

export function voceFormDaEsercizio(esercizio: Esercizio): VoceForm {
  const o = esercizio.obiettivo
  return {
    ...predefiniti,
    chiave: `e${esercizio.id}`,
    esercizioId: esercizio.id,
    catalogoId: null,
    nome: esercizio.nome,
    nomeEn: esercizio.nomeEn,
    categoria: esercizio.categoria,
    tipo: o.tipo,
    ...(o.tipo === 'serie'
      ? {
          serie: String(o.serie),
          ripMin: String(o.ripMin),
          ripMax: String(o.ripMax),
          recuperoSec: String(o.recuperoSec),
        }
      : {}),
    ...(o.tipo === 'totale' ? { ripTotali: String(o.ripTotali) } : {}),
    ...(o.tipo === 'libero' ? { serieMin: String(o.serieMin), serieMax: String(o.serieMax) } : {}),
    nota: esercizio.nota ?? '',
    incrementoKg: esercizio.incrementoKg ? String(esercizio.incrementoKg) : '',
  }
}

// Nuova riga per un esercizio scelto dall'elenco (della persona o del catalogo).
export function nuovaVoceForm(chiave: string, scelta: VoceElenco): VoceForm {
  return {
    ...predefiniti,
    chiave,
    esercizioId: scelta.id,
    catalogoId: scelta.id === null ? scelta.catalogoId : null,
    nome: scelta.nome,
    nomeEn: scelta.nomeEn,
    categoria: scelta.categoria,
    tipo: 'serie',
  }
}

const NON_VALIDO = Symbol('non valido')

function campo(testo: string, intero: boolean): number | null | typeof NON_VALIDO {
  if (testo.trim() === '') return null
  const valore = intero ? parseIntero(testo) : parseNumero(testo)
  return valore === null ? NON_VALIDO : valore
}

// Dalla riga dell'editor ai dati da inviare al server. I campi che non servono al tipo vanno a null.
export function vocePerInvio(voce: VoceForm): VocePerInvio | { errore: string } {
  const serie = campo(voce.serie, true)
  const ripMin = campo(voce.ripMin, true)
  const ripMax = campo(voce.ripMax, true)
  const recuperoSec = campo(voce.recuperoSec, true)
  const ripTotali = campo(voce.ripTotali, true)
  const serieMin = campo(voce.serieMin, true)
  const serieMax = campo(voce.serieMax, true)
  const incrementoKg = campo(voce.incrementoKg, false)

  const tutti = [serie, ripMin, ripMax, recuperoSec, ripTotali, serieMin, serieMax, incrementoKg]
  if (tutti.some((valore) => valore === NON_VALIDO)) return { errore: `Controlla i numeri di ${voce.nome}` }

  const numero = (valore: number | null | typeof NON_VALIDO) => (valore === NON_VALIDO ? null : valore)
  const èSerie = voce.tipo === 'serie'

  return {
    esercizioId: voce.esercizioId,
    catalogoId: voce.catalogoId,
    tipo: voce.tipo,
    serie: èSerie ? numero(serie) : null,
    ripMin: èSerie ? numero(ripMin) : null,
    ripMax: èSerie ? numero(ripMax) : null,
    recuperoSec: èSerie ? numero(recuperoSec) : null,
    ripTotali: voce.tipo === 'totale' ? numero(ripTotali) : null,
    serieMin: voce.tipo === 'libero' ? numero(serieMin) : null,
    serieMax: voce.tipo === 'libero' ? numero(serieMax) : null,
    nota: voce.nota.trim() === '' ? null : voce.nota.trim(),
    incrementoKg: numero(incrementoKg),
  }
}
