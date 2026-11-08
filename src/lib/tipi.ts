// Una serie come è salvata nel database. Il peso è vuoto per gli esercizi a corpo libero.
export type SerieRegistrata = { pesoKg: number | null; ripetizioni: number }

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
  // Altri nomi con cui si può cercare l'esercizio ("curl in piedi"), separati da a capo. Non si mostrano.
  alias: string
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
}
