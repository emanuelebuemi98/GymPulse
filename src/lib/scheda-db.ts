import type { Giorno } from '../data/scheda'
import { db } from './db'
import type { VoceCatalogo } from './tipi'
import { esercizioDaVoce } from './voci'

const includeVoci = {
  voci: { orderBy: { ordine: 'asc' as const }, include: { esercizio: true } },
}

// Le tre giornate con i loro esercizi, nell'ordine della scheda.
export async function leggiScheda(): Promise<Giorno[]> {
  const righe = await db.giornoScheda.findMany({ orderBy: { numero: 'asc' }, include: includeVoci })
  return righe.map((riga) => ({
    id: riga.id,
    numero: riga.numero,
    titolo: riga.titolo,
    focus: riga.focus,
    esercizi: riga.voci.map(esercizioDaVoce),
  }))
}

export async function leggiGiorno(id: string): Promise<Giorno | null> {
  const riga = await db.giornoScheda.findUnique({ where: { id }, include: includeVoci })
  if (!riga) return null
  return {
    id: riga.id,
    numero: riga.numero,
    titolo: riga.titolo,
    focus: riga.focus,
    esercizi: riga.voci.map(esercizioDaVoce),
  }
}

// Tutti gli esercizi noti, in ordine alfabetico: la scheda e quelli aggiunti a mano.
export async function leggiCatalogo(): Promise<VoceCatalogo[]> {
  const righe = await db.esercizio.findMany({ orderBy: { nome: 'asc' } })
  return righe
    .map((riga) => ({ id: riga.id, nome: riga.nome, muscoli: riga.muscoli }))
    .sort((a, b) => a.nome.localeCompare(b.nome, 'it'))
}
