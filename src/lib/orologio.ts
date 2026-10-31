// Limiti dei dati dell'orologio. Stanno in un file senza librerie perché li usano sia il lettore dei file TCX,
// che gira nel browser, sia le regole di validazione sul server.

export const BATTITO_MIN = 30
export const BATTITO_MAX = 250
export const KCAL_MAX = 10_000

// La massima non può stare sotto la media: se succede, il dato è sbagliato (o scambiato di campo).
export function controllaBattiti(media: number | null, massima: number | null): string | null {
  if (media !== null && massima !== null && massima < media) {
    return 'La frequenza massima non può essere più bassa della media'
  }
  return null
}
