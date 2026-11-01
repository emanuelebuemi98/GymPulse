import { createHmac, randomInt, timingSafeEqual } from 'node:crypto'

// Codici monouso (OTP) mandati per email: sei cifre, valgono dieci minuti e si possono provare cinque volte.
// Nel database non finisce il codice ma un HMAC calcolato con AUTH_SECRET: sei cifre sono un milione di
// possibilità, quindi un hash semplice si ricalcolerebbe in un attimo da chi legge la tabella, mentre senza il
// segreto l'HMAC non si può provare a indovinare.

export const SCADENZA_CODICE_MS = 10 * 60 * 1000
export const TENTATIVI_MASSIMI = 5
export const INTERVALLO_INVII_MS = 60 * 1000
export const INVII_ORA_MASSIMI = 3
export const INVII_GIORNO_MASSIMI = 10
// Verso una stessa casella, qualunque sia lo scopo: ferma chi vuole riempire di email l'indirizzo di un altro.
export const INVII_DESTINATARIO_ORA_MASSIMI = 3

export type ScopoCodice = 'email' | 'recupero' | 'registrazione'

export function generaCodiceOtp(): string {
  return String(randomInt(0, 1_000_000)).padStart(6, '0')
}

// `soggetto` è a chi appartiene il codice: l'id numerico di una persona, oppure l'id casuale di una registrazione
// ancora in attesa (l'account non esiste finché l'indirizzo non è confermato). Entra nell'HMAC, quindi un codice
// non vale per un'altra persona né per un altro scopo.
export function hashCodiceOtp(segreto: string, soggetto: number | string, scopo: ScopoCodice, codice: string): string {
  return createHmac('sha256', segreto).update(`otp|${soggetto}|${scopo}|${codice}`).digest('base64url')
}

export function codiceOtpGiusto(
  segreto: string,
  soggetto: number | string,
  scopo: ScopoCodice,
  codice: string,
  hashArchiviato: string,
): boolean {
  const atteso = Buffer.from(hashArchiviato)
  const calcolato = Buffer.from(hashCodiceOtp(segreto, soggetto, scopo, codice))
  return atteso.length === calcolato.length && timingSafeEqual(atteso, calcolato)
}

// Il codice come lo scrive una persona: con o senza spazi in mezzo ("123 456"). Null se non sono sei cifre.
export function normalizzaCodiceOtp(testo: string): string | null {
  const pulito = testo.replace(/\s/g, '')
  return /^\d{6}$/.test(pulito) ? pulito : null
}

const PER_COSA: Record<ScopoCodice, string> = {
  registrazione: 'per confermare il tuo indirizzo e creare l’account',
  email: 'per confermare il nuovo indirizzo del tuo account',
  recupero: 'per scegliere una nuova password',
}

// L'email col codice. Solo testo semplice, senza link: non c'è niente da cliccare e niente da falsificare.
// Il codice non è nell'oggetto, che si vede anche a schermo bloccato.
export function messaggioCodice(codice: string, scopo: ScopoCodice): { oggetto: string; testo: string } {
  return {
    oggetto: 'Il tuo codice GymPulse',
    testo: [
      `Il tuo codice GymPulse è: ${codice}`,
      '',
      `Serve ${PER_COSA[scopo]}. Vale 10 minuti e si può usare una sola volta.`,
      '',
      'Se non l’hai chiesto tu, ignora questa email: senza il codice nessuno può fare nulla sul tuo account.',
      'Non dire mai questo codice a nessuno.',
    ].join('\n'),
  }
}
