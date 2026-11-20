import { macchinaCardio, minutiInTesto, numeroInTesto, secondiDaMinuti, TRATTO_PREDEFINITO_SEC, VELOCITA_MAX, VELOCITA_MIN, PENDENZA_MAX } from './cardio'
import { èATempo, èCardio, fuoriDaSuperSerie } from './categorie'
import type { Esercizio } from './scheda-tipi'
import { parseIntero, parseNumero } from './numeri'
import type { VoceElenco } from './tipi'
import { DURATA_PREDEFINITA, RECUPERO_PREDEFINITO, RECUPERO_PREDEFINITO_TEMPO } from './voci'

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
  // La durata di ogni serie in secondi, solo per gli esercizi a tempo (isometria); vuota per gli altri. Una bozza scritta prima
  // non ce l'ha (vedi bozza-scheda.ts).
  durataSec: string
  // Per il cardio: la velocità (km/h) e la pendenza (%) di ogni tratto, vuote se la macchina non le ha. Per il cardio `durataSec` resta
  // in secondi e la riga dell'editor lo mostra in minuti; per le macchine senza velocità la voce ha solo i tratti e la durata.
  velocitaKmh: string
  inclinazionePct: string
}

// Un esercizio a tempo ha serie e durata (uguale per tutte le serie) al posto di ripetizioni e carico a salire, e non sta in una super
// serie. Lo è se la sua categoria è a tempo (isometria o cardio), oppure se la scheda ha già una durata per lui.
export function èVoceATempo(voce: Pick<VoceForm, 'categoria' | 'durataSec'>): boolean {
  return èATempo(voce.categoria) || èCardio(voce.categoria) || voce.durataSec !== ''
}

// Il cardio si fa a tratti: tratti, durata di ognuno in minuti e, sulle macchine che le hanno, velocità e pendenza. Niente recupero.
export function èVoceCardio(voce: Pick<VoceForm, 'categoria'>): boolean {
  return èCardio(voce.categoria)
}

// Cosa ha la macchina di questa voce (si riconosce dal nome inglese del catalogo): la velocità e la pendenza, oppure niente.
export function macchinaDi(voce: Pick<VoceForm, 'categoria' | 'nomeEn'>) {
  return èCardio(voce.categoria) ? macchinaCardio(voce.nomeEn) : null
}

// Gli esercizi di isometria (a tempo), cardio e stretching non si mettono in una super serie.
export function èFuoriDaSuperSerie(voce: Pick<VoceForm, 'categoria' | 'durataSec'>): boolean {
  return èVoceATempo(voce) || fuoriDaSuperSerie(voce.categoria)
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
  durataSec: number | null
  velocitaKmh: number | null
  inclinazionePct: number | null
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
  durataSec: '',
  velocitaKmh: '',
  inclinazionePct: '',
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
    // Per il cardio la durata si scrive in minuti (7,5); per le tenute resta in secondi.
    durataSec: o.durataSec !== undefined ? (èCardio(esercizio.categoria) ? minutiInTesto(o.durataSec) : String(o.durataSec)) : '',
    velocitaKmh: o.velocitaKmh !== undefined ? numeroInTesto(o.velocitaKmh) : '',
    inclinazionePct: o.inclinazionePct !== undefined ? numeroInTesto(o.inclinazionePct) : '',
  }
}

// Nuova riga per un esercizio scelto dall'elenco (della persona o del catalogo). Se è a tempo parte con 3 serie da 30 secondi.
export function nuovaVoceForm(chiave: string, scelta: VoceElenco): VoceForm {
  const aTempo = èATempo(scelta.categoria)
  const cardio = èCardio(scelta.categoria)
  // Il cardio parte con un tratto da 20 minuti e, se la macchina ha la velocità, una velocità di partenza (un passo di camminata veloce
  // per la camminata inclinata, un trotto per il resto) che si cambia subito.
  const macchina = cardio ? macchinaCardio(scelta.nomeEn) : null
  return {
    ...predefiniti,
    ...(aTempo ? { ripMin: '1', ripMax: '1', recuperoSec: String(RECUPERO_PREDEFINITO_TEMPO), durataSec: String(DURATA_PREDEFINITA) } : {}),
    ...(cardio ? { serie: '1', ripMin: '1', ripMax: '1', recuperoSec: '0', durataSec: minutiInTesto(TRATTO_PREDEFINITO_SEC) } : {}),
    ...(macchina ? { velocitaKmh: scelta.nomeEn.toLowerCase().includes('walk') ? '5' : '8' } : {}),
    ...(macchina?.pendenza ? { inclinazionePct: scelta.nomeEn.toLowerCase().includes('walk') ? '5' : '0' } : {}),
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

  const cardio = èVoceCardio(voce)
  // Il cardio ha la durata in minuti (anche con la virgola: 7,5); tutto il resto in secondi interi.
  const durataSec = cardio ? campo(voce.durataSec, false) : campo(voce.durataSec, true)
  const velocita = campo(voce.velocitaKmh, false)
  const pendenza = campo(voce.inclinazionePct, false)

  const tutti = [serie, ripMin, ripMax, recuperoSec, incrementoKg, recuperoGruppo, durataSec, velocita, pendenza]
  if (tutti.some((valore) => valore === NON_VALIDO)) return { errore: `Controlla i numeri di ${voce.nome}` }

  const numero = (valore: number | null | typeof NON_VALIDO) => (valore === NON_VALIDO ? null : valore)

  // Un esercizio a tempo: serie, durata e recupero. Le ripetizioni, il carico a salire e la super serie non esistono per lui.
  if (èVoceATempo(voce)) {
    const minutiOSecondi = numero(durataSec)
    if (minutiOSecondi === null) return { errore: cardio ? `Scrivi i minuti di ogni tratto di ${voce.nome}` : `Scrivi la durata di ogni serie di ${voce.nome}` }
    // Il cardio: i minuti scritti diventano secondi interi (da 1 secondo a 60 minuti).
    const secondi = cardio ? secondiDaMinuti(minutiOSecondi) : minutiOSecondi
    if (secondi === null) return { errore: `I minuti di ${voce.nome} devono essere da 1 secondo a 60 minuti` }
    const macchina = macchinaDi(voce)
    const velocitaScritta = numero(velocita)
    if (cardio && macchina) {
      if (velocitaScritta === null) return { errore: `Scrivi la velocità di ${voce.nome}` }
      if (velocitaScritta < VELOCITA_MIN || velocitaScritta > VELOCITA_MAX) {
        return { errore: `La velocità di ${voce.nome} deve essere da ${numeroInTesto(VELOCITA_MIN)} a ${VELOCITA_MAX} km/h` }
      }
      const pendenzaScritta = numero(pendenza)
      if (pendenzaScritta !== null && (pendenzaScritta < 0 || pendenzaScritta > PENDENZA_MAX)) {
        return { errore: `La pendenza di ${voce.nome} deve essere da 0 a ${PENDENZA_MAX}%` }
      }
    }
    return {
      esercizioId: voce.esercizioId,
      catalogoId: voce.catalogoId,
      tipo: 'serie',
      serie: numero(serie),
      ripMin: 1,
      ripMax: 1,
      // Il cardio non ha recupero: tra un tratto e l'altro si passa subito al successivo.
      recuperoSec: cardio ? 0 : numero(recuperoSec),
      nota: voce.nota.trim() === '' ? null : voce.nota.trim(),
      incrementoKg: null,
      ripSerie: null,
      gruppo: null,
      recuperoGruppoSec: null,
      durataSec: secondi,
      velocitaKmh: cardio && macchina ? velocitaScritta : null,
      inclinazionePct: cardio && macchina?.pendenza ? numero(pendenza) : null,
    }
  }

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
    durataSec: null,
    velocitaKmh: null,
    inclinazionePct: null,
  }
}
