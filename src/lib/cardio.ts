// Il cardio a tratti: ogni tratto ha una durata e, sulle macchine che la mostrano, una velocità (e una pendenza). Da lì si ricavano i km e le
// calorie. Funzioni pure, usate sia dal server (che ricalcola prima di salvare) sia dal browser (che le mostra mentre si scrive).
//
// Le calorie sono una STIMA: le equazioni dell'ACSM (American College of Sports Medicine) per il consumo di ossigeno sul tapis roulant, e
// 5 kcal per ogni litro di ossigeno. Sono calorie lorde (comprendono anche quelle che si consumerebbero a riposo) e non tengono conto di
// come si corre, del vento o delle scarpe: l'ordine di grandezza è giusto, il numero preciso no.

// Le macchine per cui si calcola da velocità e tempo: si riconoscono dal nome inglese del catalogo (uguale per tutti). `pendenza`: la macchina
// ha l'inclinazione. Le altre voci di cardio (cyclette, ellittica, air bike, stair master) non hanno una velocità che dica le calorie: lì
// si scrive solo il tempo, più i km e le calorie del display se si vuole.
const CON_VELOCITA: Record<string, { pendenza: boolean }> = {
  'treadmill running': { pendenza: true },
  'incline treadmill walk': { pendenza: true },
  'outdoor running': { pendenza: false },
}

export type MacchinaCardio = { velocita: true; pendenza: boolean }

// La macchina con la velocità di cui si parla, oppure null se per questo esercizio non c'è (o se non è di cardio).
export function macchinaCardio(nomeEn: string): MacchinaCardio | null {
  const trovata = CON_VELOCITA[nomeEn.trim().toLowerCase()]
  return trovata ? { velocita: true, pendenza: trovata.pendenza } : null
}

// I limiti: gli stessi dei CHECK nel database (migrazione cardio_a_tratti) e della validazione.
export const VELOCITA_MIN = 0.5
export const VELOCITA_MAX = 30
export const PENDENZA_MAX = 40
export const TRATTO_MAX_SEC = 3600
export const PESO_MIN = 20
export const PESO_MAX = 400
// Quanto dura un tratto quando la scheda non lo dice: una voce di cardio salvata prima dei tratti, o appena scelta dall'elenco.
export const TRATTO_PREDEFINITO_SEC = 1200

// Da questa velocità in su si corre: cambia l'equazione. Tra 6 e 8 km/h è una scelta, e 7 è a metà.
const SOGLIA_CORSA_KMH = 7

// I km di un tratto: velocità per tempo. Arrotondati ai metri (due decimali), come si leggono sul display.
export function kmTratto(velocitaKmh: number, durataSec: number): number {
  return Math.round(((velocitaKmh * durataSec) / 3600) * 100) / 100
}

// Le calorie di un tratto, intere. `inclinazionePct` vuota = 0. Null se manca il peso o qualcosa non va.
export function kcalTratto(velocitaKmh: number, inclinazionePct: number | null, durataSec: number, pesoKg: number | null): number | null {
  if (pesoKg === null || !(pesoKg > 0) || !(velocitaKmh > 0) || !(durataSec > 0)) return null
  const metriAlMinuto = (velocitaKmh * 1000) / 60
  const pendenza = (inclinazionePct ?? 0) / 100
  // Ossigeno consumato, in ml per kg e per minuto: l'orizzontale, la salita e quello a riposo (3,5).
  const vo2 =
    velocitaKmh < SOGLIA_CORSA_KMH
      ? 0.1 * metriAlMinuto + 1.8 * metriAlMinuto * pendenza + 3.5
      : 0.2 * metriAlMinuto + 0.9 * metriAlMinuto * pendenza + 3.5
  // ml/kg/min × kg × minuti = ml di ossigeno; 5 kcal per litro.
  return Math.round((vo2 * pesoKg * (durataSec / 60) * 5) / 1000)
}

export type TrattoCardio = {
  durataSec: number
  velocitaKmh: number | null
  inclinazionePct: number | null
  km: number | null
  kcal: number | null
}

// I totali di più tratti: il tempo, e i km e le kcal dei tratti che li hanno (quelli senza non si contano, e si dice quanti mancano).
export function totaliCardio(tratti: TrattoCardio[]): { durataSec: number; km: number | null; kcal: number | null; senzaKcal: number } {
  const conKm = tratti.filter((t) => t.km !== null)
  const conKcal = tratti.filter((t) => t.kcal !== null)
  return {
    durataSec: tratti.reduce((somma, t) => somma + t.durataSec, 0),
    km: conKm.length === 0 ? null : Math.round(conKm.reduce((somma, t) => somma + (t.km ?? 0), 0) * 100) / 100,
    kcal: conKcal.length === 0 ? null : conKcal.reduce((somma, t) => somma + (t.kcal ?? 0), 0),
    senzaKcal: tratti.length - conKcal.length,
  }
}

// Il testo di un numero con la virgola, per i campi (7,5 e non 7.5), senza zeri inutili: 8 → «8», 10.7 → «10,7».
export function numeroInTesto(valore: number): string {
  return String(Math.round(valore * 100) / 100).replace('.', ',')
}

// Da secondi a minuti per i campi: 1200 → «20», 450 → «7,5».
export function minutiInTesto(secondi: number): string {
  return numeroInTesto(secondi / 60)
}

// Da minuti scritti a secondi interi (7,5 → 450), oppure null se il numero non va da 1 secondo a 60 minuti.
export function secondiDaMinuti(minuti: number): number | null {
  const secondi = Math.round(minuti * 60)
  return Number.isFinite(secondi) && secondi >= 1 && secondi <= TRATTO_MAX_SEC ? secondi : null
}

// I dati di un tratto da salvare: se il tratto ha la velocità, km e calorie si ricalcolano qui (con il peso della seduta) e quello che
// arriva dal browser non conta; altrimenti valgono km e calorie scritti a mano (le macchine senza velocità). Il server e il browser usano
// la stessa funzione, quindi quello che si vede mentre si scrive è quello che si salva.
export function completaTratto(
  tratto: { durataSec: number | null; velocitaKmh: number | null; inclinazionePct: number | null; km: number | null; kcal: number | null },
  pesoKg: number | null,
): { km: number | null; kcal: number | null } {
  if (tratto.durataSec !== null && tratto.velocitaKmh !== null) {
    return {
      km: kmTratto(tratto.velocitaKmh, tratto.durataSec),
      kcal: kcalTratto(tratto.velocitaKmh, tratto.inclinazionePct, tratto.durataSec, pesoKg),
    }
  }
  return { km: tratto.km, kcal: tratto.kcal }
}

// Un numero scritto da una persona in un campo (la virgola vale come il punto), oppure null se è vuoto o non è un numero.
export function numeroDaTestoCardio(testo: string): number | null {
  const pulito = testo.trim().replace(',', '.')
  if (pulito === '') return null
  const valore = Number(pulito)
  return Number.isFinite(valore) ? valore : null
}

// La velocità e la pendenza con cui parte un tratto nuovo: un passo di camminata veloce in salita per la camminata inclinata, un trotto in
// piano per il resto. Si cambiano subito, sia nell'editor della scheda sia in sessione. Null se la macchina non ha la velocità.
export function partenzaCardio(nomeEn: string): { velocitaKmh: number; inclinazionePct: number | null } | null {
  const macchina = macchinaCardio(nomeEn)
  if (!macchina) return null
  const camminata = nomeEn.toLowerCase().includes('walk')
  return { velocitaKmh: camminata ? 5 : 8, inclinazionePct: macchina.pendenza ? (camminata ? 5 : 0) : null }
}
