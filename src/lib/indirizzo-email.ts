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

export type EsitoGmail = { ok: true; email: string } | { ok: false; errore: string }

// Parte locale di un indirizzo Gmail: solo lettere, numeri e punti, e il punto non può stare all'inizio, alla fine né
// doppio (sono le regole che Google dà per i nomi Gmail: "puoi usare lettere, numeri e punti"). Il "+" non è un carattere di
// un nome Gmail, è un alias che porta nella stessa casella: qui si chiede l'indirizzo vero. La lunghezza non si controlla:
// non ho trovato il limite scritto da Google, e i conti più vecchi possono non rispettare quelli di oggi.
const PARTE_LOCALE_GMAIL = /^[a-z0-9]+(?:\.[a-z0-9]+)*$/

// Un indirizzo Gmail come lo scrive una persona, in forma normale, oppure la frase che spiega cosa non va. Serve a
// registrazione e Account: l'email non si può confermare alla registrazione (non c'è nessun codice da ricopiare), quindi
// almeno si pretende un indirizzo che abbia la forma di un Gmail vero.
export function validaGmail(testo: string): EsitoGmail {
  const pulito = testo.trim().toLowerCase()
  const generico = 'Scrivi un indirizzo Gmail, per esempio nome@gmail.com'
  if (pulito === '') return { ok: false, errore: generico }

  const parti = pulito.split('@')
  if (parti.length !== 2) return { ok: false, errore: generico }
  const [locale, dominio] = parti
  if (locale === '' || dominio === '') return { ok: false, errore: generico }
  if (dominio !== 'gmail.com') {
    return { ok: false, errore: 'Per ora si può usare solo un indirizzo Gmail, che finisce con @gmail.com' }
  }
  if (locale.includes('+')) return { ok: false, errore: 'Scrivi l’indirizzo Gmail senza il segno +' }
  if (!PARTE_LOCALE_GMAIL.test(locale)) {
    return {
      ok: false,
      errore: 'Un indirizzo Gmail ha solo lettere, numeri e punti, e non comincia né finisce con un punto',
    }
  }

  const email = normalizzaEmail(pulito)
  return email === null ? { ok: false, errore: generico } : { ok: true, email }
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
