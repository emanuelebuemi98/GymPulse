import type { Esercizio, Obiettivo } from './scheda-tipi'

// Una voce della scheda come è salvata nel database: l'obiettivo è spezzato in colonne facoltative. C'è un solo tipo di obiettivo,
// «serie × ripetizioni». Le colonne dei due tipi tolti (`ripTotali`, `serieMin`, `serieMax`) restano nel database, vuote: il codice
// di prima le legge ancora, e toglierle romperebbe un ritorno indietro. Qui non si usano più.
export type VoceDb = {
  tipo: string
  serie: number | null
  ripMin: number | null
  ripMax: number | null
  recuperoSec: number | null
  serieMin?: number | null
  nota: string | null
  incrementoKg: number | null
  // Le ripetizioni di ogni serie, "12,10,8,6", quando sono diverse; vuoto = uguali per tutte.
  ripSerie: string | null
  // Il gruppo (superset, triset, gigantset) e il suo recupero: tutti e due scritti, o tutti e due vuoti.
  gruppo: number | null
  recuperoGruppoSec: number | null
  esercizio: {
    id: number
    nome: string
    categoria: string
    catalogoId: number | null
    catalogo: { nomeEn: string; immagine: string | null } | null
  }
}

// Le colonne dell'obiettivo che si scrivono nel database.
export type CampiObiettivo = {
  tipo: 'serie'
  serie: number
  ripMin: number
  ripMax: number
  recuperoSec: number
  ripSerie: string | null
}

export const RECUPERO_PREDEFINITO = 90

// Dal testo del database ("12,10,8,6") all'elenco delle ripetizioni. Si usa solo se è fatto bene e ha tante voci quante sono le
// serie: altrimenti si ignora, e l'esercizio torna ad avere le stesse ripetizioni per tutte.
function leggiRipSerie(testo: string | null, serie: number): number[] | undefined {
  if (!testo || !/^\d+(,\d+)*$/.test(testo)) return undefined
  const valori = testo.split(',').map(Number)
  return valori.length === serie && valori.every((valore) => valore >= 1 && valore <= 100) ? valori : undefined
}

// Dalla riga del database all'esercizio che usa l'app. I valori mancanti prendono dei predefiniti sensati (anche per una riga di
// un vecchio tipo non ancora convertita: per «serie a scelta» le serie sono il minimo di prima).
export function esercizioDaVoce(voce: VoceDb): Esercizio {
  const serie = voce.serie ?? voce.serieMin ?? 3
  const ripSerie = leggiRipSerie(voce.ripSerie, serie)
  const ripMin = ripSerie ? Math.min(...ripSerie) : (voce.ripMin ?? 8)
  const obiettivo: Obiettivo = {
    tipo: 'serie',
    serie,
    ripMin,
    ripMax: ripSerie ? Math.max(...ripSerie) : (voce.ripMax ?? ripMin),
    recuperoSec: voce.recuperoSec ?? RECUPERO_PREDEFINITO,
    ...(ripSerie ? { ripSerie } : {}),
  }

  return {
    id: voce.esercizio.id,
    nome: voce.esercizio.nome,
    nomeEn: voce.esercizio.catalogo?.nomeEn ?? '',
    immagine: voce.esercizio.catalogo?.immagine ?? '',
    catalogoRif: voce.esercizio.catalogoId,
    categoria: voce.esercizio.categoria,
    obiettivo,
    ...(voce.nota ? { nota: voce.nota } : {}),
    ...(voce.incrementoKg ? { incrementoKg: voce.incrementoKg } : {}),
    ...(voce.gruppo !== null && voce.recuperoGruppoSec !== null
      ? { gruppo: { numero: voce.gruppo, recuperoSec: voce.recuperoGruppoSec } }
      : {}),
  }
}

// Dall'obiettivo alle colonne del database.
export function campiObiettivo(obiettivo: Obiettivo): CampiObiettivo {
  return {
    tipo: 'serie',
    serie: obiettivo.serie,
    ripMin: obiettivo.ripMin,
    ripMax: obiettivo.ripMax,
    recuperoSec: obiettivo.recuperoSec,
    ripSerie: obiettivo.ripSerie ? obiettivo.ripSerie.join(',') : null,
  }
}
