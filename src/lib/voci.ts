import { TRATTO_PREDEFINITO_SEC } from './cardio'
import { èATempo, èCardio, fuoriDaSuperSerie } from './categorie'
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
  // La durata di ogni serie in secondi, solo per gli esercizi a tempo (isometria) e di cardio; vuota per gli altri.
  durataSec?: number | null
  // Solo per il cardio con velocità (tapis roulant, corsa all'aperto): la velocità e la pendenza di partenza di ogni tratto.
  velocitaKmh?: number | null
  inclinazionePct?: number | null
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
  durataSec: number | null
  velocitaKmh: number | null
  inclinazionePct: number | null
}

export const RECUPERO_PREDEFINITO = 90
// Il recupero che propone l'app per un esercizio a tempo: una tenuta stanca meno di una serie con il carico.
export const RECUPERO_PREDEFINITO_TEMPO = 60
// La durata di una serie a tempo quando la scheda non ne dice una (una voce di isometria salvata prima del timer).
export const DURATA_PREDEFINITA = 30

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
  // Un esercizio a tempo (isometria) ha una durata al posto delle ripetizioni. Si riconosce dalla categoria oppure dalla durata
  // scritta: una voce di isometria salvata prima del timer non ha la durata e prende quella predefinita, senza toccare il database.
  // Una voce a tempo non ha ripetizioni, carico a salire né super serie, qualunque cosa dica la riga.
  const cardio = èCardio(voce.esercizio.categoria)
  const tempo = cardio || (voce.durataSec ?? null) !== null || èATempo(voce.esercizio.categoria)
  // Né un esercizio a tempo né uno di cardio o stretching fa parte di una super serie, anche se una scheda di prima ce l'ha messo:
  // il gruppo si toglie qui, in lettura, senza toccare il database (lo scioglie poi scheda-db.ts se resta un esercizio solo).
  const senzaGruppo = tempo || fuoriDaSuperSerie(voce.esercizio.categoria)
  // Il cardio si fa a tratti. Una voce di cardio salvata prima (3 × 8-10 con il recupero) si legge come un solo tratto da 20 minuti,
  // senza recupero: il database non si tocca, e salvando la giornata la voce diventa a tratti davvero.
  const cardioDiPrima = cardio && (voce.durataSec ?? null) === null
  const serie = cardioDiPrima ? 1 : (voce.serie ?? voce.serieMin ?? 3)
  const ripSerie = tempo ? undefined : leggiRipSerie(voce.ripSerie, serie)
  const ripMin = tempo ? 1 : ripSerie ? Math.min(...ripSerie) : (voce.ripMin ?? 8)
  const obiettivo: Obiettivo = {
    tipo: 'serie',
    serie,
    ripMin,
    ripMax: tempo ? 1 : ripSerie ? Math.max(...ripSerie) : (voce.ripMax ?? ripMin),
    recuperoSec: cardio ? (cardioDiPrima ? 0 : (voce.recuperoSec ?? 0)) : (voce.recuperoSec ?? RECUPERO_PREDEFINITO),
    ...(ripSerie ? { ripSerie } : {}),
    ...(tempo ? { durataSec: voce.durataSec ?? (cardio ? TRATTO_PREDEFINITO_SEC : DURATA_PREDEFINITA) } : {}),
    ...(cardio ? { cardio: true as const } : {}),
    ...(cardio && voce.velocitaKmh != null ? { velocitaKmh: voce.velocitaKmh } : {}),
    ...(cardio && voce.velocitaKmh != null && voce.inclinazionePct != null ? { inclinazionePct: voce.inclinazionePct } : {}),
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
    ...(!tempo && voce.incrementoKg ? { incrementoKg: voce.incrementoKg } : {}),
    ...(!senzaGruppo && voce.gruppo !== null && voce.recuperoGruppoSec !== null
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
    durataSec: obiettivo.durataSec ?? null,
    velocitaKmh: obiettivo.velocitaKmh ?? null,
    inclinazionePct: obiettivo.velocitaKmh !== undefined ? (obiettivo.inclinazionePct ?? null) : null,
  }
}
