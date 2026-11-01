import type { Giorno } from './scheda-tipi'
import { db } from './db'
import type { VoceCatalogo } from './tipi'
import { esercizioDaVoce } from './voci'

const includeVoci = {
  voci: { orderBy: { ordine: 'asc' as const }, include: { esercizio: true } },
}

// Le giornate della scheda di una persona con i loro esercizi, nell'ordine delle sigle (A, B, C, ...). Quelle tolte dalla
// scheda e rimaste solo per lo storico (attiva = false) non ci sono: lo storico le legge dalle sedute.
export async function leggiScheda(userId: number): Promise<Giorno[]> {
  const righe = await db.giornoScheda.findMany({
    where: { userId, attiva: true },
    orderBy: { id: 'asc' },
    include: includeVoci,
  })
  return righe.map((riga) => ({
    id: riga.id,
    titolo: riga.titolo,
    esercizi: riga.voci.map(esercizioDaVoce),
  }))
}

export async function leggiGiorno(userId: number, id: string): Promise<Giorno | null> {
  const riga = await db.giornoScheda.findUnique({ where: { userId_id: { userId, id } }, include: includeVoci })
  if (!riga || !riga.attiva) return null
  return {
    id: riga.id,
    titolo: riga.titolo,
    esercizi: riga.voci.map(esercizioDaVoce),
  }
}

// Quante sedute sono state registrate su una giornata: serve a dire, prima di toglierla, cosa succede allo storico.
export function contaSeduteGiornata(userId: number, giornoId: string): Promise<number> {
  return db.sessione.count({ where: { userId, giornoId } })
}

// Gli esercizi noti a una persona, in ordine alfabetico: quelli della sua scheda e quelli aggiunti a mano.
export async function leggiCatalogo(userId: number): Promise<VoceCatalogo[]> {
  const righe = await db.esercizio.findMany({ where: { userId } })
  return righe
    .map((riga) => ({ id: riga.id, nome: riga.nome, muscoli: riga.muscoli }))
    .sort((a, b) => a.nome.localeCompare(b.nome, 'it'))
}
