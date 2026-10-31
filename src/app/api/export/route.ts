import { utenteCorrente } from '@/lib/accesso'
import { creaCsv } from '@/lib/csv'
import { dataIso } from '@/lib/formato'
import { sedutePerCsv } from '@/lib/storico'

// Legge il database a ogni richiesta.
export const dynamic = 'force-dynamic'

export async function GET() {
  // Il file contiene tutte le sedute di UNA persona: senza accesso non esce nulla, e con l'accesso escono
  // solo le sue.
  const userId = await utenteCorrente()
  if (!userId) {
    return Response.json({ errore: 'Non autorizzato' }, { status: 401 })
  }

  const csv = creaCsv(await sedutePerCsv(userId))

  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="gympulse-sedute-${dataIso(new Date())}.csv"`,
      'Cache-Control': 'no-store',
    },
  })
}
