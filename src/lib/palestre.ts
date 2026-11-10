// Le palestre a cui un utente può dire di appartenere. Funzioni pure, usate sia dal server sia dal browser.
//
// L'elenco sta qui e non nel database: aggiungere una palestra è aggiungere una riga qui sotto, senza migrazioni. In
// `User.palestra` finisce il nome in maiuscolo, esattamente come scritto in questa lista; nessuna palestra = campo vuoto (NULL).
//
// Scegliere una palestra è anche il consenso: i personal trainer di quella palestra possono vedere e modificare la scheda
// (mai le sedute, i kg, i grafici o l'email) di chi l'ha scelta. Per questo il testo libero non esiste: un nome scritto a mano
// farebbe vedere la scheda a chi capita di scrivere lo stesso nome.

export const PALESTRE = ['NEW LIGHTWEIGHT GYM 24H', 'THE IRON PARADISE'] as const

export type Palestra = (typeof PALESTRE)[number]

export const NESSUNA_PALESTRA = ''

// La palestra scritta in un campo, oppure null se non è una di quelle dell'elenco (il testo vuoto è "nessuna", non un errore).
export function palestraDa(testo: unknown): Palestra | null {
  if (typeof testo !== 'string') return null
  const pulito = testo.trim().toUpperCase()
  return PALESTRE.find((palestra) => palestra === pulito) ?? null
}

export type RuoloUtente = 'utente' | 'trainer'
