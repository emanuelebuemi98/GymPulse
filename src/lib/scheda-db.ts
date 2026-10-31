import type { Giorno } from './scheda-tipi'
import { db } from './db'
import type { VoceCatalogo } from './tipi'
import { esercizioDaVoce } from './voci'

const includeVoci = {
  voci: { orderBy: { ordine: 'asc' as const }, include: { esercizio: true } },
}

// Le giornate di una persona con i loro esercizi. L'ordine è quello delle sigle: A, B, C.
export async function leggiScheda(userId: number): Promise<Giorno[]> {
  const righe = await db.giornoScheda.findMany({ where: { userId }, orderBy: { id: 'asc' }, include: includeVoci })
  return righe.map((riga) => ({
    id: riga.id,
    titolo: riga.titolo,
    esercizi: riga.voci.map(esercizioDaVoce),
  }))
}

export async function leggiGiorno(userId: number, id: string): Promise<Giorno | null> {
  const riga = await db.giornoScheda.findUnique({ where: { userId_id: { userId, id } }, include: includeVoci })
  if (!riga) return null
  return {
    id: riga.id,
    titolo: riga.titolo,
    esercizi: riga.voci.map(esercizioDaVoce),
  }
}

// Gli esercizi noti a una persona, in ordine alfabetico: quelli della sua scheda e quelli aggiunti a mano.
export async function leggiCatalogo(userId: number): Promise<VoceCatalogo[]> {
  const righe = await db.esercizio.findMany({ where: { userId } })
  return righe
    .map((riga) => ({ id: riga.id, nome: riga.nome, muscoli: riga.muscoli }))
    .sort((a, b) => a.nome.localeCompare(b.nome, 'it'))
}
