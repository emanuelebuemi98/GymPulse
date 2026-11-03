// Le categorie degli esercizi, uguali per tutti: ogni esercizio appartiene a una sola. Funzioni pure, usate sia dal
// server sia dal browser.
//
// In `Esercizio.categoria` e in `CatalogoEsercizio.categoria` finisce la chiave (per esempio `petto`), mai l'etichetta.
// Il database accetta soltanto queste dieci chiavi (vincoli scritti a mano nella migrazione `catalogo_esercizi`).

export const CATEGORIE = [
  { chiave: 'petto', etichetta: 'Petto' },
  { chiave: 'dorsali', etichetta: 'Dorsali' },
  { chiave: 'spalle', etichetta: 'Spalle' },
  { chiave: 'braccia', etichetta: 'Braccia' },
  { chiave: 'gambe', etichetta: 'Gambe' },
  { chiave: 'addome', etichetta: 'Addome' },
  { chiave: 'olimpico', etichetta: 'Olimpico' },
  { chiave: 'corpo_intero', etichetta: 'Corpo intero' },
  { chiave: 'cardio', etichetta: 'Cardio' },
  { chiave: 'altri', etichetta: 'Altri' },
] as const

export type Categoria = (typeof CATEGORIE)[number]['chiave']

export const CHIAVI_CATEGORIE = CATEGORIE.map((categoria) => categoria.chiave) as [Categoria, ...Categoria[]]

export function etichettaCategoria(chiave: Categoria): string {
  return CATEGORIE.find((categoria) => categoria.chiave === chiave)!.etichetta
}

// La categoria scritta in un testo (senza badare alle maiuscole), oppure null se è vuoto o non è una delle dieci.
export function categoriaDa(testo: string): Categoria | null {
  const chiave = testo.trim().toLowerCase()
  return CATEGORIE.find((categoria) => categoria.chiave === chiave)?.chiave ?? null
}

// Le categorie senza kg da sommare: non entrano nel grafico dei kg per categoria della panoramica.
export const CATEGORIE_SENZA_KG: readonly Categoria[] = ['addome', 'cardio']
