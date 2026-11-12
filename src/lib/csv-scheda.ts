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
// lasciare vuote: valgono i numeri che propone l'editor della scheda (3 serie da 8-10 ripetizioni, 90 secondi di recupero).
// «tipo», «rip_totali», «serie_min» e «serie_max» sono colonne dei tipi di obiettivo che non ci sono più (ripetizioni totali, serie a
// scelta): restano nel file, vuote, perché un file scritto prima si importi senza dover togliere nulla. L'importazione le legge
// e le ignora: una riga di quei tipi diventa «serie × ripetizioni» con i numeri di sempre (3 serie da 8-10).
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
  // In coda, così un file scritto prima di queste colonne si importa come sempre. `rip_per_serie`: le ripetizioni di ogni serie
  // separate da spazi ("12 10 8 6"); vuoto = uguali per tutte (rip_min e rip_max). `gruppo` e `recupero_gruppo_sec`: gli esercizi
  // vicini con la stessa etichetta sono un superset (2), un triset (3) o un gigantset (4 o più), senza pausa tra uno e l'altro,
  // con quel recupero dopo ogni giro.
  'rip_per_serie',
  'gruppo',
  'recupero_gruppo_sec',
] as const

const OBBLIGATORIE = ['giornata', 'esercizio'] as const

export type RigaScheda = {
  riga: number
  giornata: string
  titolo: string | null
  nome: string
  serie: number | null
  ripMin: number | null
  ripMax: number | null
  recuperoSec: number | null
  nota: string | null
  incrementoKg: number | null
  ripSerie: number[] | null
  // L'etichetta scritta nel file (1, 2, a…): vale dentro la giornata, e non è il numero che finisce nel database.
  gruppo: string | null
  recuperoGruppoSec: number | null
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
        'serie',
        String(o.serie),
        String(o.ripMin),
        String(o.ripMax),
        String(o.recuperoSec),
        '',
        '',
        '',
        esercizio.nota ? proteggi(esercizio.nota) : '',
        esercizio.incrementoKg ? String(esercizio.incrementoKg).replace('.', ',') : '',
        // Con gli spazi e non con i trattini: Excel trasforma "12-10" in una data.
        o.ripSerie ? o.ripSerie.join(' ') : '',
        esercizio.gruppo ? String(esercizio.gruppo.numero) : '',
        esercizio.gruppo ? String(esercizio.gruppo.recuperoSec) : '',
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

type EsitoRipSerie = { ok: true; valori: number[] | null } | { ok: false; errore: string }

// Le ripetizioni di ogni serie: numeri da 1 a 100 separati da spazi, virgole, trattini o barre ("12 10 8 6", "12-10-8-6"). Il file
// scritto dall'app usa gli spazi perché Excel trasforma "12-10" in una data; se è successo lo stesso, il numero che ne esce è
// fuori dai limiti e l'importazione lo dice.
function ripPerSerie(testo: string): EsitoRipSerie {
  const parti = testo.split(/[\s,\-/]+/).filter((parte) => parte !== '')
  if (parti.length === 0) return { ok: true, valori: null }
  if (parti.length > 20) return { ok: false, errore: 'le ripetizioni per serie sono troppe (al massimo 20 serie)' }
  const valori = parti.map((parte) => (/^\d+$/.test(parte) ? Number(parte) : Number.NaN))
  if (valori.some((valore) => !Number.isInteger(valore) || valore < 1 || valore > 100)) {
    return {
      ok: false,
      errore: `le ripetizioni per serie "${testo}" non vanno bene: scrivi un numero da 1 a 100 per ogni serie, separati da spazi (12 10 8 6). Se Excel ha cambiato il testo in una data, scrivilo con gli spazi e imposta la cella come testo`,
    }
  }
  return { ok: true, valori }
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

    // La colonna «tipo» c'è ancora, ma di tipo ce n'è uno solo: «serie» (o vuoto). Un file scritto quando c'erano «totale» e «libero»
    // non si rifiuta: quelle righe diventano «serie × ripetizioni» con i numeri di sempre.
    const tipoScritto = cella('tipo').toLowerCase()
    const vecchioTipo = tipoScritto === 'totale' || tipoScritto === 'libero'
    if (tipoScritto !== '' && tipoScritto !== 'serie' && !vecchioTipo) {
      return errore(`il tipo "${cella('tipo')}" non è valido: l'unico tipo è serie (o lascia la cella vuota)`)
    }

    const numeri = {
      serie: intero(cella('serie'), 'le serie'),
      ripMin: intero(cella('rip_min'), 'le ripetizioni minime'),
      ripMax: intero(cella('rip_max'), 'le ripetizioni massime'),
      recuperoSec: intero(cella('recupero_sec'), 'il recupero'),
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

    // Ripetizioni diverse per ogni serie (solo per i tipi "serie"): se ci sono, le serie sono tante quante le ripetizioni scritte,
    // a meno che non sia scritto anche il numero di serie (e allora devono coincidere: lo controlla la validazione).
    const rip = ripPerSerie(scopri(cella('rip_per_serie')))
    if (!rip.ok) return errore(rip.errore)

    // Super serie: l'etichetta serve solo a dire quali righe vanno insieme. Il recupero del gruppo è un numero intero di secondi.
    const gruppoTesto = scopri(cella('gruppo')).toLowerCase()
    if (gruppoTesto.length > 20) return errore('l\'etichetta del gruppo è troppo lunga (massimo 20 caratteri)')
    const recuperoGruppo = intero(cella('recupero_gruppo_sec'), 'il recupero del gruppo')
    if (!recuperoGruppo.ok) return errore(recuperoGruppo.errore)

    // Le celle vuote prendono i valori dell'editor. Una riga di un vecchio tipo (totale, libero) non porta i numeri delle serie: ha
    // 3 serie da 8-10 ripetizioni.
    risultato.push({
      riga: numero,
      giornata,
      titolo: titolo === '' ? null : titolo,
      nome,
      serie: vecchioTipo ? 3 : (n('serie') ?? rip.valori?.length ?? 3),
      ripMin: vecchioTipo ? 8 : (n('ripMin') ?? 8),
      ripMax: vecchioTipo ? 10 : n('ripMax'),
      recuperoSec: vecchioTipo ? null : n('recuperoSec'),
      nota: cella('nota') === '' ? null : scopri(cella('nota')),
      incrementoKg: incrementoTesto === '' ? null : Number(incrementoTesto.replace(',', '.')),
      ripSerie: vecchioTipo ? null : rip.valori,
      gruppo: gruppoTesto === '' ? null : gruppoTesto,
      recuperoGruppoSec: recuperoGruppo.valore,
    })
  }

  if (risultato.length === 0) return { ok: false, errore: 'Il file non contiene nessun esercizio' }
  return { ok: true, righe: risultato }
}
