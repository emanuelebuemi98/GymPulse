import { utenteCorrente } from '@/lib/accesso'
import { creaBackup } from '@/lib/backup'
import { dataIso } from '@/lib/formato'
import { datiPerBackup } from '@/lib/storico'

// Legge il database a ogni richiesta.
export const dynamic = 'force-dynamic'

export async function GET() {
  // Il backup contiene tutti i dati di UNA persona: senza accesso non esce nulla, e con l'accesso
  // escono solo i suoi.
  const userId = await utenteCorrente()
  if (!userId) {
    return Response.json({ errore: 'Non autorizzato' }, { status: 401 })
  }

  const oggi = new Date()
  const backup = creaBackup(await datiPerBackup(userId), oggi)

  return new Response(JSON.stringify(backup, null, 2), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Disposition': `attachment; filename="gympulse-backup-${dataIso(oggi)}.json"`,
      'Cache-Control': 'no-store',
    },
  })
}
