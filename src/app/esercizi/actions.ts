'use server'

import { db } from '@/lib/db'
import { utenteCorrente } from '@/lib/accesso'
import type { DettaglioEsercizio } from '@/lib/tipi'

const VUOTO: DettaglioEsercizio = {
  nomeEn: '',
  attrezzatura: '',
  muscoloPrincipale: '',
  muscoliSecondari: '',
  esecuzione: [],
  accortezze: [],
  immagine: null,
}

// Una riga di testo per ogni voce, senza righe vuote.
const righe = (testo: string | null) => (testo ?? '').split(/\r?\n/).map((r) => r.trim()).filter((r) => r !== '')

// Quello che il database dice di un esercizio: nome inglese, attrezzatura, muscoli, come si esegue, le accortezze e la foto.
// Si legge a richiesta quando la persona sceglie o apre l'esercizio, e non viaggia con l'elenco intero. L'esercizio si
// indica con l'id del catalogo (per quelli non ancora suoi) oppure con il proprio id: in quel caso si legge solo se è
// collegato al catalogo ed è davvero della persona. Per un esercizio personale restituisce tutto vuoto.
export async function leggiDettaglio(
  catalogoId: unknown,
  esercizioId: unknown,
): Promise<DettaglioEsercizio> {
  const userId = await utenteCorrente()
  if (!userId) return VUOTO

  let idCatalogo: number | null = null
  if (typeof catalogoId === 'number' && Number.isInteger(catalogoId) && catalogoId > 0 && catalogoId <= 2_147_483_647) {
    idCatalogo = catalogoId
  } else if (typeof esercizioId === 'number' && Number.isInteger(esercizioId) && esercizioId > 0 && esercizioId <= 2_147_483_647) {
    const proprio = await db.esercizio.findFirst({ where: { id: esercizioId, userId }, select: { catalogoId: true } })
    idCatalogo = proprio?.catalogoId ?? null
  }
  if (idCatalogo === null) return VUOTO

  const riga = await db.catalogoEsercizio.findUnique({ where: { id: idCatalogo } })
  if (!riga) return VUOTO
  return {
    nomeEn: riga.nomeEn,
    attrezzatura: riga.attrezzatura,
    muscoloPrincipale: riga.muscoloPrincipale,
    muscoliSecondari: riga.muscoliSecondari,
    esecuzione: righe(riga.esecuzione),
    accortezze: righe(riga.accortezze),
    immagine: riga.immagine,
  }
}
