// Le categorie standard dei gruppi muscolari: ogni esercizio appartiene a una sola, scelta dalla scheda. Funzioni pure,
// usate sia dal server sia dal browser.
//
// In `Esercizio.muscoli` finisce il nome della categoria (PETTO). Il database accetta soltanto questi sette nomi (vedi
// la migrazione muscoli_standard) oppure il testo vuoto, che resta agli esercizi arrivati da un file CSV finché non
// li si apre dalla scheda.

export const GRUPPI_MUSCOLARI = ['PETTO', 'SPALLE', 'BICIPITI', 'TRICIPITI', 'DORSO', 'GAMBE', 'ADDOME'] as const
export type GruppoMuscolare = (typeof GRUPPI_MUSCOLARI)[number]

// La categoria scritta in un testo (senza badare alle maiuscole), oppure null se è vuoto o non è una delle sette.
export function gruppoDa(testo: string): GruppoMuscolare | null {
  const nome = testo.trim().toUpperCase()
  return GRUPPI_MUSCOLARI.find((gruppo) => gruppo === nome) ?? null
}
