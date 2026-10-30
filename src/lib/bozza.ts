// Bozza della sessione in corso, salvata nel browser: se la pagina si ricarica o l'app viene chiusa
// a metà allenamento, le serie già confermate non si perdono. Tutto in try/catch: lo spazio può non essere disponibile.
const PREFISSO = 'gympulse-bozza-'
const VALIDITA_MS = 12 * 60 * 60 * 1000

export function leggiBozza<T>(giornoId: string, ora = Date.now()): T | null {
  try {
    const grezzo = localStorage.getItem(PREFISSO + giornoId)
    if (!grezzo) return null
    const letto: unknown = JSON.parse(grezzo)
    if (typeof letto !== 'object' || letto === null) return null
    const { salvatoIl, dati } = letto as { salvatoIl?: unknown; dati?: unknown }
    if (typeof salvatoIl !== 'number' || ora - salvatoIl > VALIDITA_MS) {
      localStorage.removeItem(PREFISSO + giornoId)
      return null
    }
    return dati as T
  } catch {
    return null
  }
}

export function salvaBozza(giornoId: string, dati: unknown): void {
  try {
    localStorage.setItem(PREFISSO + giornoId, JSON.stringify({ salvatoIl: Date.now(), dati }))
  } catch {
    // spazio pieno o storage bloccato: la bozza è solo una comodità
  }
}

export function eliminaBozza(giornoId: string): void {
  try {
    localStorage.removeItem(PREFISSO + giornoId)
  } catch {
    // niente da fare
  }
}
