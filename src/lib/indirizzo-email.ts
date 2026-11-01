// Indirizzi email. Si salvano in minuscolo e senza spazi.
//
// Il controllo è volutamente stretto: l'indirizzo finisce nell'intestazione di un messaggio, quindi niente nomi
// con le virgolette, niente spazi, niente caratteri strani. Un indirizzo valido ma insolito viene rifiutato (e chi lo
// ha può usarne un altro): meglio questo che accettare qualcosa che non si sa spedire.

const LUNGHEZZA_MAX = 254
const PARTE_LOCALE = /^[a-z0-9]+(?:[._%+-][a-z0-9]+)*$/
const ETICHETTA = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/

// L'indirizzo come lo scrive una persona, in forma normale; null se non è un indirizzo.
export function normalizzaEmail(testo: string): string | null {
  const email = testo.trim().toLowerCase()
  if (email.length < 6 || email.length > LUNGHEZZA_MAX) return null

  const parti = email.split('@')
  if (parti.length !== 2) return null
  const [locale, dominio] = parti
  if (locale.length > 64 || !PARTE_LOCALE.test(locale)) return null

  const etichette = dominio.split('.')
  if (etichette.length < 2 || !etichette.every((etichetta) => ETICHETTA.test(etichetta))) return null
  if (!/^[a-z]{2,}$/.test(etichette[etichette.length - 1])) return null
  return email
}

// La casella a cui arriva davvero un indirizzo: serve ai limiti, non all'invio. Senza "+qualcosa" (name+1@ e name+2@
// sono la stessa casella) e, su Gmail, senza i punti (n.ame@gmail.com è name@gmail.com). Altrimenti basterebbe
// cambiare l'alias per aggirare il limite di invii verso una stessa persona.
export function chiaveEmail(email: string): string {
  const [locale, dominio] = email.split('@')
  const base = locale.split('+')[0]
  if (dominio === 'gmail.com' || dominio === 'googlemail.com') return `${base.replaceAll('.', '')}@gmail.com`
  return `${base}@${dominio}`
}

// L'indirizzo con la parte locale nascosta, tranne la prima lettera: m•••@gmail.com. Si mostra solo a chi è entrato
// nel proprio account, mai a chi sta recuperando una password.
export function mascheraEmail(email: string): string {
  const [locale, dominio] = email.split('@')
  return `${locale[0] ?? ''}•••@${dominio ?? ''}`
}
