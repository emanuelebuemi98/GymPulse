import type { Esercizio, Obiettivo } from './scheda-tipi'

// Una voce della scheda come è salvata nel database: l'obiettivo è spezzato in colonne facoltative.
export type VoceDb = {
  tipo: string
  serie: number | null
  ripMin: number | null
  ripMax: number | null
  recuperoSec: number | null
  ripTotali: number | null
  serieMin: number | null
  serieMax: number | null
  nota: string | null
  incrementoKg: number | null
  esercizio: { id: number; nome: string; categoria: string; catalogo: { nomeEn: string } | null }
}

export type CampiObiettivo = Pick<
  VoceDb,
  'tipo' | 'serie' | 'ripMin' | 'ripMax' | 'recuperoSec' | 'ripTotali' | 'serieMin' | 'serieMax'
>

export const RECUPERO_PREDEFINITO = 90

// Dalla riga del database all'esercizio che usa l'app. I valori mancanti prendono dei predefiniti sensati.
export function esercizioDaVoce(voce: VoceDb): Esercizio {
  let obiettivo: Obiettivo
  if (voce.tipo === 'totale' && voce.ripTotali) {
    obiettivo = { tipo: 'totale', ripTotali: voce.ripTotali }
  } else if (voce.tipo === 'libero' && voce.serieMin) {
    obiettivo = { tipo: 'libero', serieMin: voce.serieMin, serieMax: voce.serieMax ?? voce.serieMin }
  } else {
    const ripMin = voce.ripMin ?? 8
    obiettivo = {
      tipo: 'serie',
      serie: voce.serie ?? 3,
      ripMin,
      ripMax: voce.ripMax ?? ripMin,
      recuperoSec: voce.recuperoSec ?? RECUPERO_PREDEFINITO,
    }
  }

  return {
    id: voce.esercizio.id,
    nome: voce.esercizio.nome,
    nomeEn: voce.esercizio.catalogo?.nomeEn ?? '',
    categoria: voce.esercizio.categoria,
    obiettivo,
    ...(voce.nota ? { nota: voce.nota } : {}),
    ...(voce.incrementoKg ? { incrementoKg: voce.incrementoKg } : {}),
  }
}

// Dall'obiettivo alle colonne del database. Quelle che non servono al tipo restano vuote.
export function campiObiettivo(obiettivo: Obiettivo): CampiObiettivo {
  const vuoti = {
    serie: null,
    ripMin: null,
    ripMax: null,
    recuperoSec: null,
    ripTotali: null,
    serieMin: null,
    serieMax: null,
  }
  switch (obiettivo.tipo) {
    case 'serie':
      return {
        ...vuoti,
        tipo: 'serie',
        serie: obiettivo.serie,
        ripMin: obiettivo.ripMin,
        ripMax: obiettivo.ripMax,
        recuperoSec: obiettivo.recuperoSec,
      }
    case 'totale':
      return { ...vuoti, tipo: 'totale', ripTotali: obiettivo.ripTotali }
    case 'libero':
      return { ...vuoti, tipo: 'libero', serieMin: obiettivo.serieMin, serieMax: obiettivo.serieMax }
  }
}
