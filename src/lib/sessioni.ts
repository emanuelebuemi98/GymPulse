import { db } from './db'
import type { UltimaSessione } from './sessione-schema'
import { UTENTE_LOCALE_ID } from './utente'

// Id del giorno dell'ultimo allenamento registrato, o null se non c'è ancora storico.
export async function ultimoGiornoRegistrato(): Promise<string | null> {
  const ultima = await db.sessione.findFirst({
    where: { userId: UTENTE_LOCALE_ID },
    orderBy: { data: 'desc' },
    select: { giornoId: true },
  })
  return ultima?.giornoId ?? null
}

// Serie dell'ultimo allenamento dello stesso giorno, raggruppate per esercizio.
export async function ultimaSessioneDelGiorno(giornoId: string): Promise<UltimaSessione | null> {
  const ultima = await db.sessione.findFirst({
    where: { userId: UTENTE_LOCALE_ID, giornoId },
    orderBy: { data: 'desc' },
    include: { serie: { orderBy: { ordine: 'asc' } } },
  })
  if (!ultima) return null

  const serie: UltimaSessione['serie'] = {}
  for (const riga of ultima.serie) {
    serie[riga.esercizioId] ??= []
    serie[riga.esercizioId].push({ pesoKg: riga.pesoKg, ripetizioni: riga.ripetizioni })
  }
  return { pesoCorporeoKg: ultima.pesoCorporeoKg, serie }
}
