// Una serie come è salvata nel database. Il peso è vuoto per gli esercizi a corpo libero.
export type SerieRegistrata = { pesoKg: number | null; ripetizioni: number }

// L'ultima volta che hai fatto un esercizio: serve a precompilare i suggerimenti.
// datiIniziali = true: serie importate a mano, con ripetizioni non registrate davvero.
export type UltimaVolta = {
  data: string // ISO, per poterla passare al browser
  datiIniziali: boolean
  serie: SerieRegistrata[]
}

export type UltimeVolte = Record<string, UltimaVolta>

export type VoceCatalogo = { id: string; nome: string; muscoli: string }
