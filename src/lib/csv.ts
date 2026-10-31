import { z } from 'zod'
import { dataIso } from './formato'
import { durataSchema, noteSchema, serieSchema } from './sessione-schema'

// Esportazione e importazione delle sedute in CSV: una riga per ogni serie. Il file si apre in Excel (separatore
// punto e virgola, decimali con la virgola, UTF-8 con BOM) e si legge anche con la virgola o il punto, se è stato
// salvato da un altro programma. Contiene solo le sedute: la scheda si rifà dall'app.

export const LIMITE_CSV = 900_000 // caratteri: i server action accettano al massimo 1 MB
const RIGHE_MASSIME = 20_000
const SEDUTE_MASSIME = 2_000
const SERIE_MASSIME_PER_SEDUTA = 1_000

const SEPARATORE = ';'
const COLONNE = [
  'data',
  'giornata',
  'esercizio',
  'serie',
  'peso_kg',
  'ripetizioni',
  'durata_min',
  'note',
  'dati_iniziali',
] as const
// Le altre colonne si possono omettere: un file scritto a mano può avere solo queste.
const OBBLIGATORIE = ['data', 'giornata', 'esercizio', 'peso_kg', 'ripetizioni'] as const

export type SedutaEsportata = {
  data: Date
  giornoId: string
  durataMinuti: number | null
  note: string | null
  datiIniziali: boolean
  serie: { esercizio: string; pesoKg: number | null; ripetizioni: number }[]
}

// riga = prima riga del file in cui compare la seduta, per i messaggi di errore.
export type SedutaImportata = SedutaEsportata & { riga: number }

export type EsitoCsv = { ok: true; sedute: SedutaImportata[] } | { ok: false; errore: string }

// Chi apre il file in Excel potrebbe eseguire una formula scritta in un nome o in una nota: i testi che
// iniziano con uno di questi caratteri portano un apostrofo davanti, che l'importazione toglie.
const INIZIO_PERICOLOSO = /^[=+\-@\t\r]/

function proteggi(testo: string): string {
  return INIZIO_PERICOLOSO.test(testo) ? `'${testo}` : testo
}

function scopri(testo: string): string {
  return testo.startsWith("'") && INIZIO_PERICOLOSO.test(testo.slice(1)) ? testo.slice(1) : testo
}

function campo(valore: string): string {
  return /[;"\r\n]/.test(valore) ? `"${valore.replaceAll('"', '""')}"` : valore
}

export function creaCsv(sedute: SedutaEsportata[]): string {
  const righe: string[][] = [[...COLONNE]]
  for (const seduta of sedute) {
    const progressivi = new Map<string, number>()
    for (const serie of seduta.serie) {
      const numero = (progressivi.get(serie.esercizio) ?? 0) + 1
      progressivi.set(serie.esercizio, numero)
      righe.push([
        seduta.data.toISOString(),
        proteggi(seduta.giornoId),
        proteggi(serie.esercizio),
        String(numero),
        serie.pesoKg === null ? '' : String(serie.pesoKg).replace('.', ','),
        String(serie.ripetizioni),
        seduta.durataMinuti === null ? '' : String(seduta.durataMinuti),
        seduta.note === null ? '' : proteggi(seduta.note),
        seduta.datiIniziali ? 'si' : 'no',
      ])
    }
  }
  return `﻿${righe.map((riga) => riga.map(campo).join(SEPARATORE)).join('\r\n')}\r\n`
}

// Divide il testo in righe e celle, con le virgolette del formato CSV: una cella tra virgolette può contenere
// il separatore, un a capo e le virgolette stesse (raddoppiate). Null se le virgolette non si chiudono.
function dividi(testo: string, separatore: string): string[][] | null {
  const righe: string[][] = []
  let riga: string[] = []
  let cella = ''
  let traVirgolette = false

  for (let i = 0; i < testo.length; i++) {
    const c = testo[i]
    if (traVirgolette) {
      if (c !== '"') cella += c
      else if (testo[i + 1] === '"') {
        cella += '"'
        i++
      } else traVirgolette = false
    } else if (c === '"' && cella === '') {
      traVirgolette = true
    } else if (c === separatore) {
      riga.push(cella)
      cella = ''
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && testo[i + 1] === '\n') i++
      riga.push(cella)
      righe.push(riga)
      riga = []
      cella = ''
    } else {
      cella += c
    }
  }
  if (traVirgolette) return null
  if (cella !== '' || riga.length > 0) {
    riga.push(cella)
    righe.push(riga)
  }
  return righe
}

// Il separatore è quello più frequente nella prima riga: un file salvato all'estero usa la virgola.
function separatoreDi(testo: string): string {
  const intestazione = testo.split(/\r?\n/, 1)[0]
  const conteggi = [';', ',', '\t'].map((s) => [s, intestazione.split(s).length - 1] as const)
  const [separatore, quanti] = conteggi.reduce((migliore, c) => (c[1] > migliore[1] ? c : migliore))
  return quanti > 0 ? separatore : SEPARATORE
}

function giornoDaTesto(testo: string): [number, number, number] | null {
  const iso = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(testo)
  if (iso) return [Number(iso[1]), Number(iso[2]), Number(iso[3])]
  const italiana = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(testo)
  if (italiana) return [Number(italiana[3]), Number(italiana[2]), Number(italiana[1])]
  return null
}

// Tre forme: l'istante completo scritto dall'esportazione, AAAA-MM-GG e GG/MM/AAAA. Un giorno senza ora vale
// mezzogiorno UTC, che a Roma cade sempre nello stesso giorno. Null se non esiste, è prima del 2000 o è nel futuro.
export function leggiData(testo: string, ora = new Date()): Date | null {
  const giorno = giornoDaTesto(testo)
  if (giorno) {
    const [anno, mese, giornoDelMese] = giorno
    const data = new Date(Date.UTC(anno, mese - 1, giornoDelMese, 12))
    const esiste =
      data.getUTCFullYear() === anno && data.getUTCMonth() === mese - 1 && data.getUTCDate() === giornoDelMese
    if (!esiste || anno < 2000 || dataIso(data) > dataIso(ora)) return null
    return data
  }

  if (!z.iso.datetime({ offset: true }).safeParse(testo).success) return null
  const data = new Date(testo)
  if (data.getUTCFullYear() < 2000 || data.getTime() > ora.getTime() + 60_000) return null
  return data
}

const nomeEsercizioSchema = z.string().min(1, 'manca il nome dell\'esercizio').max(60, 'il nome dell\'esercizio è troppo lungo')

export function leggiCsv(testo: string, ora = new Date()): EsitoCsv {
  const pulito = testo.replace(/^﻿/, '')
  const celle = dividi(pulito, separatoreDi(pulito))
  if (celle === null) return { ok: false, errore: 'Il file ha delle virgolette che non si chiudono' }

  // Il numero di riga è quello che si vede in Excel (la prima è l'intestazione); le righe vuote si saltano.
  const righe = celle.flatMap((valori, indice) =>
    valori.every((valore) => valore.trim() === '') ? [] : [{ numero: indice + 1, valori }],
  )
  if (righe.length === 0) return { ok: false, errore: 'Il file è vuoto' }
  if (righe.length > RIGHE_MASSIME + 1) return { ok: false, errore: 'Il file ha troppe righe' }

  const intestazione = righe[0].valori.map((nome) => nome.trim().toLowerCase().replace(/\s+/g, '_'))
  for (const nome of OBBLIGATORIE) {
    if (!intestazione.includes(nome)) {
      return { ok: false, errore: `Il file non è un export di GymPulse: manca la colonna "${nome}"` }
    }
  }
  const posizione = new Map(intestazione.map((nome, indice) => [nome, indice]))
  const sedute = new Map<string, SedutaImportata>()

  for (const { numero, valori } of righe.slice(1)) {
    const cella = (nome: string) => valori[posizione.get(nome) ?? -1]?.trim() ?? ''
    const errore = (messaggio: string): EsitoCsv => ({ ok: false, errore: `Riga ${numero}: ${messaggio}` })

    const data = leggiData(cella('data'), ora)
    if (!data) return errore(`la data "${cella('data')}" non è valida (usa AAAA-MM-GG, non nel futuro)`)

    const giornoId = scopri(cella('giornata')).toUpperCase()
    if (giornoId === '' || giornoId.length > 20) return errore('manca la giornata (A, B, C…)')

    const esercizio = nomeEsercizioSchema.safeParse(scopri(cella('esercizio')))
    if (!esercizio.success) return errore(esercizio.error.issues[0].message)

    const pesoTesto = cella('peso_kg').replace(',', '.')
    if (pesoTesto !== '' && !/^\d+(\.\d+)?$/.test(pesoTesto)) return errore(`il peso "${cella('peso_kg')}" non è un numero`)
    const ripetizioniTesto = cella('ripetizioni')
    if (!/^\d+$/.test(ripetizioniTesto)) return errore(`le ripetizioni "${ripetizioniTesto}" non sono un numero intero`)
    const serie = serieSchema.safeParse({
      pesoKg: pesoTesto === '' ? null : Number(pesoTesto),
      ripetizioni: Number(ripetizioniTesto),
    })
    if (!serie.success) return errore(serie.error.issues[0].message.toLowerCase())

    const durataTesto = cella('durata_min')
    if (durataTesto !== '' && !/^\d+$/.test(durataTesto)) return errore(`la durata "${durataTesto}" non è in minuti interi`)
    const durata = durataSchema.safeParse(durataTesto === '' ? null : Number(durataTesto))
    if (!durata.success) return errore(durata.error.issues[0].message.toLowerCase())

    const nota = noteSchema.safeParse(cella('note') === '' ? null : scopri(cella('note')))
    if (!nota.success) return errore(nota.error.issues[0].message.toLowerCase())

    const iniziali = cella('dati_iniziali').toLowerCase()
    if (!['', 'no', '0', 'false', 'si', 'sì', '1', 'true'].includes(iniziali)) {
      return errore(`"dati_iniziali" deve essere si o no, non "${cella('dati_iniziali')}"`)
    }

    // Le righe con la stessa data e la stessa giornata sono una sola seduta: durata, note e dati iniziali
    // si leggono dalla prima.
    const chiave = `${data.getTime()}|${giornoId}`
    const seduta = sedute.get(chiave) ?? {
      data,
      giornoId,
      durataMinuti: durata.data,
      note: nota.data,
      datiIniziali: ['si', 'sì', '1', 'true'].includes(iniziali),
      serie: [],
      riga: numero,
    }
    seduta.serie.push({ esercizio: esercizio.data, pesoKg: serie.data.pesoKg, ripetizioni: serie.data.ripetizioni })
    if (seduta.serie.length > SERIE_MASSIME_PER_SEDUTA) return errore('la seduta ha troppe serie')
    sedute.set(chiave, seduta)
  }

  if (sedute.size === 0) return { ok: false, errore: 'Il file non contiene sedute' }
  if (sedute.size > SEDUTE_MASSIME) return { ok: false, errore: 'Il file ha troppe sedute' }
  return { ok: true, sedute: [...sedute.values()].sort((a, b) => a.data.getTime() - b.data.getTime()) }
}
