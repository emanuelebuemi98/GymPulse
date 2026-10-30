import type { Giorno } from './scheda-tipi'
import { db } from './db'
import type { VoceCatalogo } from './tipi'
import { esercizioDaVoce } from './voci'

const includeVoci = {
  voci: { orderBy: { ordine: 'asc' as const }, include: { esercizio: true } },
}

// Le giornate di una persona con i loro esercizi, nell'ordine della scheda.
export async function leggiScheda(userId: string): Promise<Giorno[]> {
  const righe = await db.giornoScheda.findMany({ where: { userId }, orderBy: { numero: 'asc' }, include: includeVoci })
  return righe.map((riga) => ({
    id: riga.id,
    numero: riga.numero,
    titolo: riga.titolo,
    focus: riga.focus,
    esercizi: riga.voci.map(esercizioDaVoce),
  }))
}

export async function leggiGiorno(userId: string, id: string): Promise<Giorno | null> {
  const riga = await db.giornoScheda.findUnique({ where: { userId_id: { userId, id } }, include: includeVoci })
  if (!riga) return null
  return {
    id: riga.id,
    numero: riga.numero,
    titolo: riga.titolo,
    focus: riga.focus,
    esercizi: riga.voci.map(esercizioDaVoce),
  }
}

// Gli esercizi noti a una persona, in ordine alfabetico: quelli della sua scheda e quelli aggiunti a mano.
export async function leggiCatalogo(userId: string): Promise<VoceCatalogo[]> {
  const righe = await db.esercizio.findMany({ where: { userId } })
  return righe
    .map((riga) => ({ id: riga.id, nome: riga.nome, muscoli: riga.muscoli }))
    .sort((a, b) => a.nome.localeCompare(b.nome, 'it'))
}
