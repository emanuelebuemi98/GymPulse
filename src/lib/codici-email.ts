import type { Prisma } from '@/generated/prisma/client'
import { db } from './db'
import { chiaveEmail } from './indirizzo-email'
import {
  INTERVALLO_INVII_MS,
  INVII_DESTINATARIO_ORA_MASSIMI,
  INVII_GIORNO_MASSIMI,
  INVII_ORA_MASSIMI,
  SCADENZA_CODICE_MS,
  TENTATIVI_MASSIMI,
  codiceOtpGiusto,
  generaCodiceOtp,
  hashCodiceOtp,
  normalizzaCodiceOtp,
  type ScopoCodice,
} from './otp'

// I codici per email nel database: crearne uno (con i limiti che evitano di riempire di messaggi una casella e di far
// bloccare l'account che li spedisce) e controllarne uno. Sono i codici di chi ha già un account: conferma
// dell'indirizzo (pagina Account) e recupero della password. La registrazione non ne usa: l'account nasce subito.

const ORA_MS = 60 * 60 * 1000
const GIORNO_MS = 24 * ORA_MS
const LIMITE_GLOBALE_PREDEFINITO = 100

// Un codice "usato" non si cancella: si fa scadere. La riga resta e continua a contare nei
// limiti, altrimenti confermare un codice libererebbe subito un altro invio e il limite si aggirerebbe in ciclo.
// Le righe si cancellano da sole dopo due giorni.
const GIA_SCADUTO = new Date(0)

// Tetto alle email di tutta l'app in 24 ore. Non protegge un conto (le email sono gratis) ma l'account che le spedisce:
// Google dichiara un massimo di 500 email al giorno per account Gmail e blocca l'invio per 1-24 ore se lo si supera.
// Si cambia con EMAIL_LIMITE_GIORNALIERO.
function limiteGlobale(): number {
  const letto = Number(process.env.EMAIL_LIMITE_GIORNALIERO)
  return Number.isInteger(letto) && letto > 0 ? letto : LIMITE_GLOBALE_PREDEFINITO
}

export type MotivoRifiuto = 'troppo-presto' | 'limite-persona' | 'limite-destinatario' | 'limite-globale'

export type EsitoCreazione = { ok: true; id: number; codice: string } | { ok: false; motivo: MotivoRifiuto }

// Cosa dire a chi si vede rifiutare un'email, uguale in recupero e collegamento dell'indirizzo.
export const MESSAGGI_RIFIUTO: Record<MotivoRifiuto, string> = {
  'troppo-presto': 'Ho appena mandato un codice a questo indirizzo: aspetta un minuto prima di chiederne un altro.',
  'limite-persona': 'Hai chiesto troppi codici. Riprova più tardi.',
  'limite-destinatario': 'A questo indirizzo sono già stati mandati troppi codici. Riprova più tardi.',
  'limite-globale': 'Il servizio email è momentaneamente fermo. Riprova più tardi.',
}

// I due tetti che valgono per qualunque email, qualunque sia lo scopo: quante ne sono partite in tutta l'app nelle ultime
// 24 ore e quante verso questa casella nell'ultima ora. Il secondo ferma chi vuole riempire di messaggi l'indirizzo di un
// altro; la casella è la `chiave`, quindi nome+1@gmail.com e nome+2@gmail.com contano come una sola.
async function tettiInvio(
  tx: Prisma.TransactionClient,
  chiave: string,
  adesso: number,
): Promise<'limite-globale' | 'limite-destinatario' | null> {
  const ultimoGiorno = new Date(adesso - GIORNO_MS)
  const ultimaOra = new Date(adesso - ORA_MS)

  const [codiciGiorno, codiciCasella] = await Promise.all([
    tx.codiceEmail.count({ where: { creatoIl: { gt: ultimoGiorno } } }),
    tx.codiceEmail.count({ where: { chiave, creatoIl: { gt: ultimaOra } } }),
  ])
  if (codiciGiorno >= limiteGlobale()) return 'limite-globale'
  if (codiciCasella >= INVII_DESTINATARIO_ORA_MASSIMI) return 'limite-destinatario'
  return null
}

// Le righe vecchie non servono più, nemmeno per contare.
async function ripulisci(tx: Prisma.TransactionClient, adesso: number): Promise<void> {
  const limite = new Date(adesso - 2 * GIORNO_MS)
  await tx.codiceEmail.deleteMany({ where: { creatoIl: { lt: limite } } })
}

// Crea un codice nuovo per questa persona. I limiti sono nel database e non in memoria: valgono per tutti i server
// e non si azzerano riavviando. Il blocco (advisory lock) fa passare una richiesta alla volta per persona, così
// dieci richieste insieme non superano i limiti tutte e dieci.
export async function creaCodiceEmail(
  segreto: string,
  userId: number,
  scopo: ScopoCodice,
  email: string,
  adesso = new Date(),
): Promise<EsitoCreazione> {
  const codice = generaCodiceOtp()
  const codiceHash = hashCodiceOtp(segreto, userId, scopo, codice)
  const chiave = chiaveEmail(email)
  const istante = adesso.getTime()

  return db.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(${userId}::bigint)`
    await ripulisci(tx, istante)

    const rifiuto = await tettiInvio(tx, chiave, istante)
    if (rifiuto) return { ok: false, motivo: rifiuto } as const

    const recenti = await tx.codiceEmail.findMany({
      where: { userId, creatoIl: { gt: new Date(istante - GIORNO_MS) } },
      select: { creatoIl: true, scopo: true },
    })
    // L'attesa di un minuto vale per lo stesso scopo: il codice di conferma dell'indirizzo, mandato un attimo prima,
    // non deve impedire di chiedere il codice di recupero (e viceversa). I tetti orario e giornaliero contano tutti.
    const piuRecente = Math.max(0, ...recenti.filter((c) => c.scopo === scopo).map((c) => c.creatoIl.getTime()))
    if (piuRecente > 0 && istante - piuRecente < INTERVALLO_INVII_MS) return { ok: false, motivo: 'troppo-presto' } as const
    const ultimaOra = recenti.filter((c) => istante - c.creatoIl.getTime() < ORA_MS).length
    if (ultimaOra >= INVII_ORA_MASSIMI || recenti.length >= INVII_GIORNO_MASSIMI) {
      return { ok: false, motivo: 'limite-persona' } as const
    }

    const creato = await tx.codiceEmail.create({
      data: { userId, scopo, email, chiave, codiceHash, creatoIl: adesso, scadeIl: new Date(istante + SCADENZA_CODICE_MS) },
      select: { id: true },
    })
    return { ok: true, id: creato.id, codice } as const
  })
}

// L'email non è partita: il codice non serve e non deve consumare i limiti della persona.
export async function annullaCodiceEmail(id: number): Promise<void> {
  await db.codiceEmail.deleteMany({ where: { id } })
}

export function invalidaCodiciEmail(userId: number, scopo?: ScopoCodice) {
  return db.codiceEmail.updateMany({
    where: { userId, ...(scopo ? { scopo } : {}), scadeIl: { gt: GIA_SCADUTO } },
    data: { scadeIl: GIA_SCADUTO },
  })
}

export type EsitoControllo = { ok: true; email: string } | { ok: false }

// Controlla il codice scritto da una persona. Vale solo l'ultimo codice mandato per quello scopo, finché non
// scade. Ogni controllo consuma un tentativo PRIMA del confronto, con un'unica scrittura nel database: richieste
// in parallelo non possono superare i tentativi consentiti. Un codice giusto scade subito, quindi vale una volta sola.
export async function controllaCodiceEmail(
  segreto: string,
  userId: number,
  scopo: ScopoCodice,
  digitato: string,
  adesso = new Date(),
): Promise<EsitoControllo> {
  const codice = normalizzaCodiceOtp(digitato)
  if (codice === null) return { ok: false }

  const riga = await db.codiceEmail.findFirst({
    where: { userId, scopo, scadeIl: { gt: adesso } },
    orderBy: { creatoIl: 'desc' },
  })
  if (!riga) return { ok: false }

  const { count } = await db.codiceEmail.updateMany({
    where: { id: riga.id, tentativi: { lt: TENTATIVI_MASSIMI } },
    data: { tentativi: { increment: 1 } },
  })
  if (count !== 1) return { ok: false }
  if (!codiceOtpGiusto(segreto, userId, scopo, codice, riga.codiceHash)) return { ok: false }

  // Uso unico: la condizione sulla scadenza fa passare una sola di due richieste che arrivano insieme.
  const { count: usati } = await db.codiceEmail.updateMany({
    where: { id: riga.id, scadeIl: { gt: adesso } },
    data: { scadeIl: GIA_SCADUTO },
  })
  return usati === 1 ? { ok: true, email: riga.email } : { ok: false }
}
