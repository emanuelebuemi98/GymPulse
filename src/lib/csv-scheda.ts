import { CATEGORIE, categoriaDa, etichettaCategoria } from './categorie'
import type { VoceCatalogo } from './catalogo-db'
import { SEPARATORE, campo, dividi, proteggi, scopri, separatoreDi } from './csv'
import type { Giorno } from './scheda-tipi'

// La scheda in CSV: una riga per ogni esercizio di ogni giornata. Serve a costruirsi la scheda in Excel: si scarica il
// catalogo intero, si cancellano le righe degli esercizi che non servono, si cambia la lettera della giornata dove occorre e
// si reimporta. Regole comuni dei file CSV in lib/csv.ts: punto e virgola, UTF-8 con BOM, virgola nei decimali, e si
// legge anche con la virgola o il tab se il file è stato salvato da un altro programma.

// Nel file del catalogo la colonna «giornata» non ha una lettera: ha questo segnaposto, che fa capire che ogni persona deve scrivere
// la propria (A, B, C… fino a G) nelle righe che tiene. Lasciarlo dov'è non è un errore di battitura da correggere in silenzio:
// l'importazione si ferma e lo dice, così nessun esercizio finisce in una giornata che non si è scelta.
export const SEGNAPOSTO_GIORNATA = '<A/B/C/D/E/F/G>'
export const RIGHE_MASSIME_SCHEDA = 2_000

// "categoria" è solo da leggere: aiuta a scegliere in Excel e l'importazione la ignora. Le colonne dopo "esercizio" si possono
// lasciare vuote: valgono i numeri che propone l'editor della scheda (3 serie da 8 ripetizioni, 90 secondi di recupero).
export const COLONNE_SCHEDA = [
  'giornata',
  'titolo',
  'esercizio',
  'categoria',
  'tipo',
  'serie',
  'rip_min',
  'rip_max',
  'recupero_sec',
  'rip_totali',
  'serie_min',
  'serie_max',
  'nota',
  'incremento_kg',
] as const

const OBBLIGATORIE = ['giornata', 'esercizio'] as const

export type TipoRiga = 'serie' | 'totale' | 'libero'

export type RigaScheda = {
  riga: number
  giornata: string
  titolo: string | null
  nome: string
  tipo: TipoRiga
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

export type EsitoCsvScheda = { ok: true; righe: RigaScheda[] } | { ok: false; errore: string }

function scrivi(righe: string[][]): string {
  return `﻿${righe.map((riga) => riga.map(campo).join(SEPARATORE)).join('\r\n')}\r\n`
}

const etichettaDi = (categoria: string) => {
  const chiave = categoriaDa(categoria)
  return chiave ? etichettaCategoria(chiave) : categoria
}

// Tutto il catalogo, nell'ordine delle categorie e poi alfabetico, già pronto per diventare una scheda: ogni riga ha 3 serie da
// 8-10 ripetizioni e il segnaposto al posto della giornata. Si tolgono le righe che non servono e nelle altre si scrive la lettera.
export function creaCsvCatalogo(voci: VoceCatalogo[]): string {
  const ordine = new Map<string, number>(CATEGORIE.map((categoria, indice) => [categoria.chiave, indice]))
  const ordinate = [...voci].sort(
    (a, b) => (ordine.get(a.categoria) ?? 99) - (ordine.get(b.categoria) ?? 99) || a.nome.localeCompare(b.nome, 'it'),
  )
  const righe: string[][] = [[...COLONNE_SCHEDA]]
  for (const voce of ordinate) {
    righe.push([
      SEGNAPOSTO_GIORNATA,
      '',
      proteggi(voce.nome),
      etichettaDi(voce.categoria),
      'serie',
      '3',
      '8',
      '10',
      '90',
      '',
      '',
      '',
      '',
      '',
    ])
  }
  return scrivi(righe)
}

// La scheda di una persona nello stesso formato: si può modificare in Excel e reimportare.
export function creaCsvScheda(giorni: Giorno[]): string {
  const righe: string[][] = [[...COLONNE_SCHEDA]]
  for (const giorno of giorni) {
    for (const esercizio of giorno.esercizi) {
      const o = esercizio.obiettivo
      righe.push([
        giorno.id,
        proteggi(giorno.titolo),
        proteggi(esercizio.nome),
        etichettaDi(esercizio.categoria),
        o.tipo,
        o.tipo === 'serie' ? String(o.serie) : '',
        o.tipo === 'serie' ? String(o.ripMin) : '',
        o.tipo === 'serie' ? String(o.ripMax) : '',
        o.tipo === 'serie' ? String(o.recuperoSec) : '',
        o.tipo === 'totale' ? String(o.ripTotali) : '',
        o.tipo === 'libero' ? String(o.serieMin) : '',
        o.tipo === 'libero' ? String(o.serieMax) : '',
        esercizio.nota ? proteggi(esercizio.nota) : '',
        esercizio.incrementoKg ? String(esercizio.incrementoKg).replace('.', ',') : '',
      ])
    }
  }
  return scrivi(righe)
}

type EsitoNumero = { ok: true; valore: number | null } | { ok: false; errore: string }

function intero(testo: string, nome: string): EsitoNumero {
  if (testo === '') return { ok: true, valore: null }
  if (!/^\d+$/.test(testo)) return { ok: false, errore: `${nome} "${testo}" non è un numero intero` }
  return { ok: true, valore: Number(testo) }
}

export function leggiCsvScheda(testo: string): EsitoCsvScheda {
  const pulito = testo.replace(/^﻿/, '')
  const celle = dividi(pulito, separatoreDi(pulito))
  if (celle === null) return { ok: false, errore: 'Il file ha delle virgolette che non si chiudono' }

  // Il numero di riga è quello che si vede in Excel (la prima è l'intestazione); le righe vuote si saltano.
  const righe = celle.flatMap((valori, indice) =>
    valori.every((valore) => valore.trim() === '') ? [] : [{ numero: indice + 1, valori }],
  )
  if (righe.length === 0) return { ok: false, errore: 'Il file è vuoto' }
  if (righe.length > RIGHE_MASSIME_SCHEDA + 1) return { ok: false, errore: 'Il file ha troppe righe' }

  const intestazione = righe[0].valori.map((nome) => nome.trim().toLowerCase().replace(/\s+/g, '_'))
  if (intestazione.includes('peso_kg') && intestazione.includes('data')) {
    return { ok: false, errore: 'Questo è un file delle sedute, che l’app non importa più: serve il file del catalogo o quello della tua scheda' }
  }
  for (const nome of OBBLIGATORIE) {
    if (!intestazione.includes(nome)) {
      return { ok: false, errore: `Il file non è un file della scheda di GymPulse: manca la colonna "${nome}"` }
    }
  }
  const posizione = new Map(intestazione.map((nome, indice) => [nome, indice]))
  const risultato: RigaScheda[] = []

  // Quante righe hanno ancora il segnaposto al posto della lettera: si dice tutto insieme, non una riga alla volta.
  const colonnaGiornata = posizione.get('giornata') ?? -1
  const senzaLettera = righe.slice(1).filter(({ valori }) => (valori[colonnaGiornata] ?? '').trim().toUpperCase() === SEGNAPOSTO_GIORNATA)

  for (const { numero, valori } of righe.slice(1)) {
    const cella = (nome: string) => valori[posizione.get(nome) ?? -1]?.trim() ?? ''
    const errore = (messaggio: string): EsitoCsvScheda => ({ ok: false, errore: `Riga ${numero}: ${messaggio}` })

    const giornata = scopri(cella('giornata')).toUpperCase()
    if (giornata === SEGNAPOSTO_GIORNATA) {
      const quante = senzaLettera.length === 1 ? 'in 1 riga' : `in ${senzaLettera.length} righe`
      return errore(
        `nella colonna «giornata» c'è ancora ${SEGNAPOSTO_GIORNATA} (${quante}): scrivi la lettera della giornata (A, B, C…) oppure cancella la riga`,
      )
    }
    if (!/^[A-Z]$/.test(giornata)) return errore(`la giornata "${cella('giornata')}" non è valida: serve una lettera (A, B, C…)`)

    const nome = scopri(cella('esercizio'))
    if (nome === '') return errore("manca il nome dell'esercizio")
    if (nome.length > 60) return errore("il nome dell'esercizio è troppo lungo")

    const titolo = scopri(cella('titolo'))
    if (titolo.length > 60) return errore('il titolo della giornata è troppo lungo (massimo 60 caratteri)')

    const tipoScritto = cella('tipo').toLowerCase()
    if (tipoScritto !== '' && tipoScritto !== 'serie' && tipoScritto !== 'totale' && tipoScritto !== 'libero') {
      return errore(`il tipo "${cella('tipo')}" non è valido: usa serie, totale o libero (o lascia vuoto)`)
    }
    const tipo: TipoRiga = tipoScritto === '' ? 'serie' : tipoScritto

    const numeri = {
      serie: intero(cella('serie'), 'le serie'),
      ripMin: intero(cella('rip_min'), 'le ripetizioni minime'),
      ripMax: intero(cella('rip_max'), 'le ripetizioni massime'),
      recuperoSec: intero(cella('recupero_sec'), 'il recupero'),
      ripTotali: intero(cella('rip_totali'), 'le ripetizioni totali'),
      serieMin: intero(cella('serie_min'), 'le serie minime'),
      serieMax: intero(cella('serie_max'), 'le serie massime'),
    }
    for (const esito of Object.values(numeri)) if (!esito.ok) return errore(esito.errore)
    const n = (chiave: keyof typeof numeri) => {
      const esito = numeri[chiave]
      return esito.ok ? esito.valore : null
    }

    const incrementoTesto = cella('incremento_kg')
    if (incrementoTesto !== '' && !/^\d+([.,]\d+)?$/.test(incrementoTesto)) {
      return errore(`l'incremento "${incrementoTesto}" non è un numero`)
    }

    // Le colonne che non servono al tipo si ignorano; quelle che servono e sono vuote prendono i valori dell'editor.
    risultato.push({
      riga: numero,
      giornata,
      titolo: titolo === '' ? null : titolo,
      nome,
      tipo,
      serie: tipo === 'serie' ? (n('serie') ?? 3) : null,
      ripMin: tipo === 'serie' ? (n('ripMin') ?? 8) : null,
      ripMax: tipo === 'serie' ? n('ripMax') : null,
      recuperoSec: tipo === 'serie' ? n('recuperoSec') : null,
      ripTotali: tipo === 'totale' ? (n('ripTotali') ?? 50) : null,
      serieMin: tipo === 'libero' ? (n('serieMin') ?? 3) : null,
      serieMax: tipo === 'libero' ? n('serieMax') : null,
      nota: cella('nota') === '' ? null : scopri(cella('nota')),
      incrementoKg: incrementoTesto === '' ? null : Number(incrementoTesto.replace(',', '.')),
    })
  }

  if (risultato.length === 0) return { ok: false, errore: 'Il file non contiene nessun esercizio' }
  return { ok: true, righe: risultato }
}
