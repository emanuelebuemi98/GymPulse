import { creaBackup } from '@/lib/backup'
import { dataIso } from '@/lib/formato'
import { datiPerBackup } from '@/lib/storico'

// Legge il database a ogni richiesta.
export const dynamic = 'force-dynamic'

export async function GET() {
  const oggi = new Date()
  const backup = creaBackup(await datiPerBackup(), oggi)

  return new Response(JSON.stringify(backup, null, 2), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Disposition': `attachment; filename="gympulse-backup-${dataIso(oggi)}.json"`,
      'Cache-Control': 'no-store',
    },
  })
}
