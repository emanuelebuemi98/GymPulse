// Bozza della sessione in corso, salvata nel browser: se la pagina si ricarica o l'app viene chiusa
// a metà allenamento, le serie già confermate non si perdono. Tutto in try/catch: lo spazio può non essere disponibile.
//
// La chiave porta l'id della persona: sullo stesso browser due account non si vedono le bozze a vicenda.
// La bozza sopravvive alla chiusura del browser e alla scadenza dell'accesso (il cookie di sessione si butta quando il
// browser si chiude): si accede di nuovo e si riprende. Vale 12 ore dall'ultimo salvataggio.
const PREFISSO = 'gympulse-bozza-'
const VALIDITA_MS = 12 * 60 * 60 * 1000

const chiave = (utenteId: number, giornoId: string) => `${PREFISSO}${utenteId}-${giornoId}`

export type BozzaSalvata = { giornoId: string; salvatoIl: number; dati: unknown }

function leggiVoce(grezzo: string | null, ora: number): { salvatoIl: number; dati: unknown } | null {
  if (!grezzo) return null
  const letto: unknown = JSON.parse(grezzo)
  if (typeof letto !== 'object' || letto === null) return null
  const { salvatoIl, dati } = letto as { salvatoIl?: unknown; dati?: unknown }
  if (typeof salvatoIl !== 'number' || ora - salvatoIl > VALIDITA_MS) return null
  return { salvatoIl, dati }
}

export function leggiBozza<T>(utenteId: number, giornoId: string, ora = Date.now()): T | null {
  const k = chiave(utenteId, giornoId)
  try {
    const voce = leggiVoce(localStorage.getItem(k), ora)
    if (!voce) {
      localStorage.removeItem(k)
      return null
    }
    return voce.dati as T
  } catch {
    return null
  }
}

export function salvaBozza(utenteId: number, giornoId: string, dati: unknown): void {
  try {
    localStorage.setItem(chiave(utenteId, giornoId), JSON.stringify({ salvatoIl: Date.now(), dati }))
  } catch {
    // spazio pieno o storage bloccato: la bozza è solo una comodità
  }
}

export function eliminaBozza(utenteId: number, giornoId: string): void {
  try {
    localStorage.removeItem(chiave(utenteId, giornoId))
  } catch {
    // niente da fare
  }
}

// Toglie dal browser TUTTE le bozze di una persona, in qualunque giornata e anche se ancora valide. Si usa quando l'account viene
// eliminato: le serie confermate a metà non devono restare nel telefono di un account che non esiste più. Le bozze degli altri
// account sullo stesso browser non si toccano (la chiave porta l'id). Restituisce quante ne ha tolte.
export function eliminaBozzeDi(utenteId: number): number {
  try {
    const inizio = `${PREFISSO}${utenteId}-`
    const daTogliere: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i)
      if (k?.startsWith(inizio)) daTogliere.push(k)
    }
    for (const k of daTogliere) localStorage.removeItem(k)
    return daTogliere.length
  } catch {
    return 0
  }
}

// Butta le bozze scadute o illeggibili di chiunque, comprese quelle salvate prima che la chiave portasse l'id della
// persona (non si leggono più e resterebbero lì per sempre). Una bozza ancora valida non si tocca mai.
function ripulisciBozzeScadute(ora: number): void {
  const daTogliere: string[] = []
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i)
    if (!k?.startsWith(PREFISSO)) continue
    try {
      if (!leggiVoce(localStorage.getItem(k), ora)) daTogliere.push(k)
    } catch {
      daTogliere.push(k)
    }
  }
  for (const k of daTogliere) localStorage.removeItem(k)
}

// Le bozze ancora valide di questa persona, una per giornata, dalla più recente.
export function bozzeInCorso(utenteId: number, ora = Date.now()): BozzaSalvata[] {
  try {
    ripulisciBozzeScadute(ora)
    const inizio = `${PREFISSO}${utenteId}-`
    const trovate: BozzaSalvata[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i)
      if (!k?.startsWith(inizio)) continue
      const voce = leggiVoce(localStorage.getItem(k), ora)
      if (voce) trovate.push({ giornoId: k.slice(inizio.length), ...voce })
    }
    return trovate.sort((a, b) => b.salvatoIl - a.salvatoIl)
  } catch {
    return []
  }
}

// Quante serie sono state confermate (con ✓) in una bozza. Una bozza senza nessuna serie confermata è solo una
// sessione aperta e richiusa: non vale la pena riprenderla. Non si fida del contenuto, che viene dal browser.
export function contaSerieConfermate(dati: unknown): number {
  if (typeof dati !== 'object' || dati === null || !('esercizi' in dati) || !Array.isArray(dati.esercizi)) return 0
  let totale = 0
  for (const esercizio of dati.esercizi as unknown[]) {
    if (typeof esercizio !== 'object' || esercizio === null || !('serie' in esercizio) || !Array.isArray(esercizio.serie)) continue
    for (const serie of esercizio.serie as unknown[]) {
      if (typeof serie === 'object' && serie !== null && 'confermata' in serie && serie.confermata === true) totale += 1
    }
  }
  return totale
}
