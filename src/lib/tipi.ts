// Una serie come è salvata nel database. Il peso è vuoto per gli esercizi a corpo libero.
// `durataSec`: i secondi tenuti, solo per gli esercizi a tempo (isometria) e di cardio: in quel caso le ripetizioni valgono 1 e non c'è il
// peso. Per un tratto di cardio ci sono anche la velocità, la pendenza, i km, le calorie e i battiti medi (tutti facoltativi).
export type SerieRegistrata = {
  pesoKg: number | null
  ripetizioni: number
  durataSec: number | null
  velocitaKmh: number | null
  inclinazionePct: number | null
  km: number | null
  kcal: number | null
  bpm: number | null
}

// Dalla riga del database alla serie che usa l'app: un posto solo, così una colonna nuova non si dimentica in uno dei punti che leggono.
export function serieDaRiga(riga: {
  pesoKg: number | null
  ripetizioni: number
  durataSec: number | null
  velocitaKmh: number | null
  inclinazionePct: number | null
  km: number | null
  kcal: number | null
  bpm: number | null
}): SerieRegistrata {
  return {
    pesoKg: riga.pesoKg,
    ripetizioni: riga.ripetizioni,
    durataSec: riga.durataSec,
    velocitaKmh: riga.velocitaKmh,
    inclinazionePct: riga.inclinazionePct,
    km: riga.km,
    kcal: riga.kcal,
    bpm: riga.bpm,
  }
}

// L'ultima volta che hai fatto un esercizio: serve a precompilare i suggerimenti.
// datiIniziali = true: serie importate a mano, con ripetizioni non registrate davvero.
export type UltimaVolta = {
  data: string // ISO, per poterla passare al browser
  datiIniziali: boolean
  serie: SerieRegistrata[]
}

// Chiave: l'id numerico dell'esercizio.
export type UltimeVolte = Record<number, UltimaVolta>

// Un esercizio che si può scegliere da un elenco. Può essere uno della persona (`id`, già nella sua lista) oppure uno del
// catalogo non ancora usato (`catalogoId`): in quel caso l'esercizio della persona nasce al salvataggio.
// categoria è la chiave ('petto') o il testo vuoto; nomeEn e muscolo servono alla riga piccola sotto il nome.
export type VoceElenco = {
  chiave: string // 'e12' per un esercizio della persona, 'c34' per uno del catalogo
  id: number | null
  catalogoId: number | null
  nome: string
  nomeEn: string
  // Il percorso dell'immagine o vuoto se non c'è.
  immagine: string
  categoria: string
  muscolo: string
}

// Quello che il database dice di un esercizio quando lo si sceglie: i testi su come farlo non viaggiano con l'elenco, si
// leggono a richiesta. Per gli esercizi personali (senza catalogo) tutti i campi sono vuoti.
export type DettaglioEsercizio = {
  nomeEn: string
  attrezzatura: string
  muscoloPrincipale: string
  muscoliSecondari: string
  esecuzione: string[] // un passo per voce
  accortezze: string[] // un errore da evitare o una cautela per voce
  immagine: string | null
  // L'animazione dell'esercizio, se c'è: nel «Come si fa» si vede al posto della foto. Senza, si vede la foto.
  gif: string | null
}
