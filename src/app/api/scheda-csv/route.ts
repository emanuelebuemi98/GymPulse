import { utenteCorrente } from '@/lib/accesso'
import { leggiCatalogo } from '@/lib/catalogo-db'
import { creaCsvCatalogo, creaCsvScheda } from '@/lib/csv-scheda'
import { dataIso } from '@/lib/formato'
import { leggiScheda } from '@/lib/scheda-db'

// Legge il database a ogni richiesta.
export const dynamic = 'force-dynamic'

// Due file, scelti con ?cosa=:
//   catalogo  tutti gli esercizi del catalogo, già in forma di scheda (giornata A): si tolgono le righe che non servono;
//   scheda    la scheda attuale di chi lo chiede, da modificare in Excel e reimportare.
// Il catalogo è uguale per tutti, ma l'accesso serve comunque: l'app non ha pagine pubbliche oltre alla presentazione.
export async function GET(richiesta: Request) {
  const userId = await utenteCorrente()
  if (!userId) {
    return Response.json({ errore: 'Non autorizzato' }, { status: 401 })
  }

  const cosa = new URL(richiesta.url).searchParams.get('cosa')
  if (cosa !== 'catalogo' && cosa !== 'scheda') {
    return Response.json({ errore: 'Richiesta non valida' }, { status: 400 })
  }

  const csv = cosa === 'catalogo' ? creaCsvCatalogo(await leggiCatalogo()) : creaCsvScheda(await leggiScheda(userId))

  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="gympulse-${cosa}-${dataIso(new Date())}.csv"`,
      'Cache-Control': 'no-store',
    },
  })
}
