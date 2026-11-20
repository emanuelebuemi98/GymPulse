// Le categorie degli esercizi, uguali per tutti: ogni esercizio appartiene a una sola. Funzioni pure, usate sia dal
// server sia dal browser.
//
// In `Esercizio.categoria` e in `CatalogoEsercizio.categoria` finisce la chiave (per esempio `petto`), mai l'etichetta.
// Il database accetta soltanto queste dodici chiavi (vincoli scritti a mano nelle migrazioni `catalogo_esercizi`,
// `categorie_riscaldamento`, `categoria_glutei`, `bicipiti_tricipiti_avambracci`, che ha diviso «braccia» in tre, e `gif_e_categoria_isometria`).

// La chiave 'riscaldamento' è rimasta com'era (sta nei vincoli del database e nel file del catalogo): quello che si vede è l'etichetta,
// «Stretching».
export const CATEGORIE = [
  { chiave: 'petto', etichetta: 'Petto' },
  { chiave: 'dorsali', etichetta: 'Dorsali' },
  { chiave: 'spalle', etichetta: 'Spalle' },
  { chiave: 'bicipiti', etichetta: 'Bicipiti' },
  { chiave: 'tricipiti', etichetta: 'Tricipiti' },
  { chiave: 'avambracci', etichetta: 'Avambracci' },
  { chiave: 'gambe', etichetta: 'Gambe' },
  { chiave: 'glutei', etichetta: 'Glutei' },
  { chiave: 'addome', etichetta: 'Addome' },
  { chiave: 'isometria', etichetta: 'Isometria' },
  { chiave: 'cardio', etichetta: 'Cardio' },
  { chiave: 'riscaldamento', etichetta: 'Stretching' },
] as const

export type Categoria = (typeof CATEGORIE)[number]['chiave']

export const CHIAVI_CATEGORIE = CATEGORIE.map((categoria) => categoria.chiave) as [Categoria, ...Categoria[]]

export function etichettaCategoria(chiave: Categoria): string {
  return CATEGORIE.find((categoria) => categoria.chiave === chiave)!.etichetta
}

// La categoria scritta in un testo (senza badare alle maiuscole), oppure null se è vuoto o non è una delle dodici.
export function categoriaDa(testo: string): Categoria | null {
  const chiave = testo.trim().toLowerCase()
  return CATEGORIE.find((categoria) => categoria.chiave === chiave)?.chiave ?? null
}

// Le categorie senza kg da sommare: non entrano nel grafico dei kg per categoria della panoramica.
export const CATEGORIE_SENZA_KG: readonly Categoria[] = ['addome', 'isometria', 'cardio', 'riscaldamento']

// Le categorie degli esercizi a tempo: si tengono o si fanno per una durata, non per ripetizioni e kg. Nella scheda hanno serie e
// durata (uguale per tutte le serie), in sessione un timer.
export const CATEGORIE_A_TEMPO: readonly Categoria[] = ['isometria']

export function èATempo(categoria: string): boolean {
  const chiave = categoriaDa(categoria)
  return chiave !== null && CATEGORIE_A_TEMPO.includes(chiave)
}

// Il cardio si fa a tratti: ogni tratto ha una durata e, sulle macchine con la velocità, la velocità e la pendenza. Da lì km e calorie
// (vedi cardio.ts). Nella scheda non ha ripetizioni, recupero né carico a salire.
export function èCardio(categoria: string): boolean {
  return categoriaDa(categoria) === 'cardio'
}

// Le categorie i cui esercizi non fanno parte di una super serie (superset, triset, gigantset): quelli a tempo hanno un timer, il
// cardio si fa su una macchina e lo stretching si fa a parte. Un esercizio senza categoria (da un vecchio file) non è escluso.
export const CATEGORIE_FUORI_DA_SUPER_SERIE: readonly Categoria[] = ['isometria', 'cardio', 'riscaldamento']

export function fuoriDaSuperSerie(categoria: string): boolean {
  const chiave = categoriaDa(categoria)
  return chiave !== null && CATEGORIE_FUORI_DA_SUPER_SERIE.includes(chiave)
}
