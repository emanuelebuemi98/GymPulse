import { dataIso } from './formato'

// Riepiloghi per la panoramica dei progressi: sedute raggruppate per settimana e per giornata della scheda.
// Le settimane vanno da lunedì a domenica e seguono il fuso di Roma, come tutte le date dell'app.

export type SedutaSintesi = {
  data: Date
  giornoId: string
  giornoTitolo: string
  volumeKg: number
  datiIniziali: boolean
}
// daVerificare: la settimana contiene una seduta con ripetizioni non registrate, quindi il volume è solo indicativo.
export type Settimana = { inizio: string; sedute: number; volumeKg: number; daVerificare: boolean }
export type GiornataConteggio = { id: string; titolo: string; sedute: number }

const GIORNO_MS = 86_400_000
const SETTIMANA_MS = 7 * GIORNO_MS

function utcDa(iso: string): number {
  const [anno, mese, giorno] = iso.split('-').map(Number)
  return Date.UTC(anno, mese - 1, giorno)
}

const isoDa = (ms: number) => new Date(ms).toISOString().slice(0, 10)

// Lunedì della settimana a cui appartiene un giorno (AAAA-MM-GG). Si calcola in UTC: nessun problema di ora legale.
export function lunediDi(iso: string): string {
  const ms = utcDa(iso)
  const giorniDalLunedi = (new Date(ms).getUTCDay() + 6) % 7
  return isoDa(ms - giorniDalLunedi * GIORNO_MS)
}

// Un istante a mezzogiorno UTC: a Roma cade sempre nello stesso giorno, quindi si può formattare con le date dell'app.
export function istanteDaIso(iso: string): Date {
  return new Date(`${iso}T12:00:00Z`)
}

// Sedute e volume di ogni settimana, dalla più vecchia. Le settimane senza sedute ci sono, a zero: così
// una pausa si vede. Si parte dalla prima seduta e si arriva alla settimana in corso, al massimo `massimo` settimane.
export function perSettimana(sedute: SedutaSintesi[], oggi = new Date(), massimo = 12): Settimana[] {
  if (sedute.length === 0) return []

  const perInizio = new Map<string, Settimana>()
  for (const seduta of sedute) {
    const inizio = lunediDi(dataIso(seduta.data))
    const settimana = perInizio.get(inizio) ?? { inizio, sedute: 0, volumeKg: 0, daVerificare: false }
    settimana.sedute += 1
    settimana.volumeKg += seduta.volumeKg
    settimana.daVerificare ||= seduta.datiIniziali
    perInizio.set(inizio, settimana)
  }

  const inizi = [...perInizio.keys()].sort()
  const ultima = utcDa(inizi[inizi.length - 1] > lunediDi(dataIso(oggi)) ? inizi[inizi.length - 1] : lunediDi(dataIso(oggi)))
  const prima = Math.max(utcDa(inizi[0]), ultima - (massimo - 1) * SETTIMANA_MS)

  const risultato: Settimana[] = []
  for (let ms = prima; ms <= ultima; ms += SETTIMANA_MS) {
    const inizio = isoDa(ms)
    risultato.push(perInizio.get(inizio) ?? { inizio, sedute: 0, volumeKg: 0, daVerificare: false })
  }
  return risultato
}

// Quante sedute per ogni giornata della scheda, nell'ordine delle sigle (A, B, C).
export function perGiornata(sedute: Pick<SedutaSintesi, 'giornoId' | 'giornoTitolo'>[]): GiornataConteggio[] {
  const giornate = new Map<string, GiornataConteggio>()
  for (const seduta of sedute) {
    const giornata = giornate.get(seduta.giornoId) ?? { id: seduta.giornoId, titolo: seduta.giornoTitolo, sedute: 0 }
    giornata.sedute += 1
    giornate.set(seduta.giornoId, giornata)
  }
  return [...giornate.values()].sort((a, b) => a.id.localeCompare(b.id, 'it'))
}
