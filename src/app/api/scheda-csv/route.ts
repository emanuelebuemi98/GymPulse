import { allievoDelTrainer, utenteCorrente } from '@/lib/accesso'
import { leggiCatalogo } from '@/lib/catalogo-db'
import { creaCsvCatalogo, creaCsvScheda } from '@/lib/csv-scheda'
import { dataIso } from '@/lib/formato'
import { leggiScheda } from '@/lib/scheda-db'
import { idDaParametro } from '@/lib/url'

// Legge il database a ogni richiesta.
export const dynamic = 'force-dynamic'

// Due file, scelti con ?cosa=:
//   catalogo  tutti gli esercizi del catalogo, già in forma di scheda (giornata A): si tolgono le righe che non servono;
//   scheda    la scheda attuale di chi lo chiede, da modificare in Excel e reimportare.
// Con ?cosa=scheda&allievo=ID un personal trainer scarica la scheda di un utente della sua palestra (per caricarla su un altro).
// Il file è la sola scheda (giornate, esercizi, serie, recuperi, note): kg e storico non ci sono, quindi non c'è altro da proteggere
// oltre all'accesso, e quello lo decide allievoDelTrainer a QUESTA richiesta, come per le pagine del trainer.
// Il catalogo è uguale per tutti, ma l'accesso serve comunque: l'app non ha pagine pubbliche oltre alla presentazione.
export async function GET(richiesta: Request) {
  const userId = await utenteCorrente()
  if (!userId) {
    return Response.json({ errore: 'Non autorizzato' }, { status: 401 })
  }

  const parametri = new URL(richiesta.url).searchParams
  const cosa = parametri.get('cosa')
  if (cosa !== 'catalogo' && cosa !== 'scheda') {
    return Response.json({ errore: 'Richiesta non valida' }, { status: 400 })
  }

  let csv: string
  // Il nome del file non contiene mai il nome di nessuno: gympulse-scheda-2026-11-21.csv, anche per la scheda di un allievo.
  const nomeFile = `gympulse-${cosa}-${dataIso(new Date())}.csv`

  const allievoScritto = parametri.get('allievo')
  if (allievoScritto !== null) {
    const allievoId = idDaParametro(allievoScritto)
    if (cosa !== 'scheda' || allievoId === null) {
      return Response.json({ errore: 'Richiesta non valida' }, { status: 400 })
    }
    // Come una pagina del trainer: chi non può non scopre nemmeno se l'utente esiste.
    const allievo = await allievoDelTrainer(userId, allievoId)
    if (!allievo) return Response.json({ errore: 'Non trovato' }, { status: 404 })
    csv = creaCsvScheda(await leggiScheda(allievoId))
  } else {
    csv = cosa === 'catalogo' ? creaCsvCatalogo(await leggiCatalogo()) : creaCsvScheda(await leggiScheda(userId))
  }

  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${nomeFile}"`,
      'Cache-Control': 'no-store',
    },
  })
}
