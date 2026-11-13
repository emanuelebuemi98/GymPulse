import { createHmac, timingSafeEqual } from 'node:crypto'
import { creaLimite } from './limite'

// Il codice d'invito per essere un personal trainer: serve per registrarsi come tale e per passare da utente a trainer dalla
// pagina Account. Lo dà il titolare dell'app a chi vuole fare il trainer: senza, chiunque potrebbe spacciarsi per trainer e
// vedere le schede della palestra che sceglie. Sta nella variabile d'ambiente CODICE_TRAINER (su Vercel: solo Production) e non
// nel codice né nel database. Cambiarla non toglie il ruolo a chi è già trainer.
//
// Se la variabile manca o è troppo corta (si indovinerebbe), l'opzione «Sono un personal trainer» non compare (né nella
// registrazione né in Account) e nessun codice vale: come per AUTH_SECRET, non esiste una modalità «aperta» per dimenticanza.

export const LUNGHEZZA_MIN_CODICE_TRAINER = 12
export const LUNGHEZZA_MAX_CODICE_TRAINER = 200

// I codici d'invito sbagliati: pochi, perché una persona vera lo scrive giusto al primo o al secondo colpo. Per istanza su Vercel,
// quindi rallenta e non blocca del tutto: la sicurezza vera è la lunghezza del codice (almeno 12 caratteri). Lo usano sia la
// registrazione sia il passaggio da Account, così chi sbaglia in un posto non ha altri tentativi nell'altro.
export const limiteCodiceTrainer = creaLimite(5, 60 * 60 * 1000)

// Il codice configurato, oppure null se manca o è troppo corto. Il motivo si scrive solo nel log del server, mai in pagina.
export function codiceTrainerConfigurato(env: Record<string, string | undefined> = process.env): string | null {
  const codice = env.CODICE_TRAINER?.trim()
  if (!codice) return null
  if (codice.length < LUNGHEZZA_MIN_CODICE_TRAINER) {
    console.error(`[trainer] CODICE_TRAINER è troppo corto (minimo ${LUNGHEZZA_MIN_CODICE_TRAINER} caratteri): l'opzione è spenta`)
    return null
  }
  return codice
}

export function registrazioneTrainerAttiva(env: Record<string, string | undefined> = process.env): boolean {
  return codiceTrainerConfigurato(env) !== null
}

// Vero se il codice scritto è quello giusto. Si confrontano gli HMAC dei due valori (stessa lunghezza sempre) con
// timingSafeEqual, così il tempo di risposta non dice quante lettere erano giuste né quanto è lungo il codice vero.
export function codiceTrainerGiusto(scritto: string, segreto: string, atteso: string | null = codiceTrainerConfigurato()): boolean {
  if (atteso === null || scritto.length > LUNGHEZZA_MAX_CODICE_TRAINER) return false
  const impronta = (valore: string) => createHmac('sha256', segreto).update(`codice-trainer|${valore}`).digest()
  return timingSafeEqual(impronta(scritto.trim()), impronta(atteso))
}
