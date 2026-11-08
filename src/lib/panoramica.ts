import { dataIso, formatNumero } from './formato'
import { CATEGORIE, CATEGORIE_SENZA_KG, categoriaDa, type Categoria } from './categorie'
import { descriviSomma } from './progressi'

// Riepiloghi per la panoramica dei progressi: sedute raggruppate per settimana e per giornata della scheda, e kg per
// gruppo muscolare. Le settimane vanno da lunedì a domenica e seguono il fuso di Roma, come tutte le date dell'app.

export type SedutaSintesi = {
  data: Date
  giornoId: string
  giornoTitolo: string
}
export type Settimana = { inizio: string; sedute: number }
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

// Il lunedì `n` settimane dopo (o prima, se negativo) il lunedì `iso`.
export function spostaSettimane(iso: string, n: number): string {
  return isoDa(utcDa(iso) + n * SETTIMANA_MS)
}

// Un istante a mezzogiorno UTC: a Roma cade sempre nello stesso giorno, quindi si può formattare con le date dell'app.
export function istanteDaIso(iso: string): Date {
  return new Date(`${iso}T12:00:00Z`)
}

// Sedute di ogni settimana, dalla più vecchia. Le settimane senza sedute ci sono, a zero: così una pausa si vede.
// Si parte dalla prima seduta e si arriva alla settimana in corso, al massimo `massimo` settimane.
export function perSettimana(sedute: SedutaSintesi[], oggi = new Date(), massimo = 12): Settimana[] {
  if (sedute.length === 0) return []

  const perInizio = new Map<string, Settimana>()
  for (const seduta of sedute) {
    const inizio = lunediDi(dataIso(seduta.data))
    const settimana = perInizio.get(inizio) ?? { inizio, sedute: 0 }
    settimana.sedute += 1
    perInizio.set(inizio, settimana)
  }

  const inizi = [...perInizio.keys()].sort()
  const ultima = utcDa(inizi[inizi.length - 1] > lunediDi(dataIso(oggi)) ? inizi[inizi.length - 1] : lunediDi(dataIso(oggi)))
  const prima = Math.max(utcDa(inizi[0]), ultima - (massimo - 1) * SETTIMANA_MS)

  const risultato: Settimana[] = []
  for (let ms = prima; ms <= ultima; ms += SETTIMANA_MS) {
    const inizio = isoDa(ms)
    risultato.push(perInizio.get(inizio) ?? { inizio, sedute: 0 })
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

// Le categorie del grafico dei kg per settimana, nell'ordine standard. Addome e cardio non ci sono: non hanno kg da sommare.
export const GRUPPI_NEL_GRAFICO: readonly Categoria[] = CATEGORIE.map((c) => c.chiave).filter(
  (chiave) => !CATEGORIE_SENZA_KG.includes(chiave),
)

export type SerieConGruppo = {
  data: Date
  esercizioId: number
  esercizio: string
  categoria: string
  pesoKg: number | null
}
// calcolo: come si arriva ai kg dell'esercizio, già scritto per il suggerimento ("25 × 4 = 100 kg").
export type EsercizioPeso = { esercizioId: number; nome: string; pesoKg: number; calcolo: string }
export type PesoGruppo = { gruppo: Categoria; pesoKg: number; esercizi: EsercizioPeso[] }

// I kg di ogni serie della settimana che comincia nel lunedì `inizio`, sommati per categoria (senza moltiplicare per le
// ripetizioni) e, dentro ogni categoria, per esercizio. Tutte le categorie del grafico ci sono, anche a zero: si vede cosa
// non è stato allenato. `senzaGruppo` sono i kg degli esercizi che non hanno ancora una categoria, per esempio quelli
// arrivati da un CSV: non si sa dove metterli, quindi si dicono a parte. I kg di addome e cardio non si contano.
export function pesoPerGruppo(
  serie: SerieConGruppo[],
  inizio: string,
): { gruppi: PesoGruppo[]; senzaGruppo: number } {
  // Le serie di ogni esercizio restano nell'ordine in cui sono state fatte: la prima seduta della settimana per prima.
  const dellaSettimana = serie
    .filter((s) => lunediDi(dataIso(s.data)) === inizio)
    .sort((a, b) => a.data.getTime() - b.data.getTime())

  const perGruppo = new Map<Categoria, Map<number, { nome: string; pesi: number[] }>>()
  let senzaGruppo = 0

  for (const s of dellaSettimana) {
    const gruppo = categoriaDa(s.categoria)
    if (gruppo === null) {
      senzaGruppo += s.pesoKg ?? 0
      continue
    }
    if (s.pesoKg === null || !GRUPPI_NEL_GRAFICO.includes(gruppo)) continue
    const esercizi = perGruppo.get(gruppo) ?? new Map<number, { nome: string; pesi: number[] }>()
    const voce = esercizi.get(s.esercizioId) ?? { nome: s.esercizio, pesi: [] }
    voce.pesi.push(s.pesoKg)
    esercizi.set(s.esercizioId, voce)
    perGruppo.set(gruppo, esercizi)
  }

  const gruppi = GRUPPI_NEL_GRAFICO.map((gruppo): PesoGruppo => {
    const esercizi = [...(perGruppo.get(gruppo) ?? [])]
      .map(([esercizioId, { nome, pesi }]): EsercizioPeso => {
        const pesoKg = pesi.reduce((totale, kg) => totale + kg, 0)
        const totale = `${formatNumero(pesoKg, 2)} kg`
        return { esercizioId, nome, pesoKg, calcolo: pesi.length === 1 ? totale : `${descriviSomma(pesi)} = ${totale}` }
      })
      .sort((a, b) => b.pesoKg - a.pesoKg || a.nome.localeCompare(b.nome, 'it'))
    return { gruppo, pesoKg: esercizi.reduce((totale, e) => totale + e.pesoKg, 0), esercizi }
  })

  return { gruppi, senzaGruppo }
}

export type RiepilogoGenerale = {
  sedute: number
  serie: number
  volumeKg: number
  minuti: number
  settimaneDiFila: number
}

// I numeri complessivi per la panoramica dei progressi. `settimane` è la lista di `perSettimana` (anche con settimane a
// zero). Le settimane di fila si contano dall'ultima verso il passato fermandosi alla prima senza sedute; se l'ultima
// settimana è a zero è quella in corso, appena cominciata, e non interrompe la serie.
export function riepilogoGenerale(
  sedute: { numeroSerie: number; volumeKg: number; durataMinuti: number | null }[],
  settimane: Settimana[],
): RiepilogoGenerale {
  const daContare = settimane.length > 0 && settimane[settimane.length - 1].sedute === 0 ? settimane.slice(0, -1) : settimane
  let settimaneDiFila = 0
  for (let i = daContare.length - 1; i >= 0 && daContare[i].sedute > 0; i--) settimaneDiFila += 1

  return {
    sedute: sedute.length,
    serie: sedute.reduce((totale, s) => totale + s.numeroSerie, 0),
    volumeKg: sedute.reduce((totale, s) => totale + s.volumeKg, 0),
    minuti: sedute.reduce((totale, s) => totale + (s.durataMinuti ?? 0), 0),
    settimaneDiFila,
  }
}
