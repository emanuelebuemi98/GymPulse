import type { Prisma } from '@/generated/prisma/client'

// Gli esercizi non si scrivono più a mano: ogni esercizio di una persona viene dal catalogo (o è uno dei suoi vecchi
// esercizi personali, che restano finché una scheda li usa). Qui c'è il passaggio dal catalogo all'esercizio della persona.

const minuscolo = (testo: string) => testo.trim().toLowerCase()

// L'esercizio di una persona collegato a una riga del catalogo: se c'è già lo restituisce, altrimenti lo crea con il nome
// italiano e la categoria del catalogo. Se la persona ha già un esercizio personale con quel nome, lo collega al catalogo
// invece di farne un secondo. Lancia un errore se la riga del catalogo non esiste.
export async function esercizioDalCatalogo(
  tx: Prisma.TransactionClient,
  userId: number,
  catalogoId: number,
): Promise<number> {
  const riga = await tx.catalogoEsercizio.findUnique({ where: { id: catalogoId }, select: { nomeIt: true, categoria: true } })
  if (!riga) throw new Error('Esercizio del catalogo non trovato')

  const collegato = await tx.esercizio.findFirst({ where: { userId, catalogoId }, select: { id: true } })
  if (collegato) return collegato.id

  const omonimo = await tx.esercizio.findFirst({
    where: { userId, catalogoId: null, nome: { equals: riga.nomeIt, mode: 'insensitive' } },
    select: { id: true },
  })
  if (omonimo) {
    await tx.esercizio.update({ where: { id: omonimo.id }, data: { catalogoId, categoria: riga.categoria } })
    return omonimo.id
  }

  const creato = await tx.esercizio.create({
    data: { userId, nome: riga.nomeIt, categoria: riga.categoria, catalogoId },
    select: { id: true },
  })
  return creato.id
}

// Ritrova un esercizio da un nome scritto in un file (il CSV): prima tra gli esercizi della persona, poi nel catalogo per
// nome italiano, nome inglese o alias (senza badare alle maiuscole). Restituisce null se non c'è: l'importazione non crea
// esercizi nuovi, quindi chi chiama deve dirlo all'utente.
export async function trovaEsercizioPerNome(
  tx: Prisma.TransactionClient,
  userId: number,
  nome: string,
): Promise<number | null> {
  const proprio = await tx.esercizio.findFirst({
    where: { userId, nome: { equals: nome.trim(), mode: 'insensitive' } },
    select: { id: true },
  })
  if (proprio) return proprio.id

  const chiave = minuscolo(nome)
  const catalogo = await tx.catalogoEsercizio.findMany({ select: { id: true, nomeIt: true, nomeEn: true, alias: true } })
  const riga = catalogo.find(
    (voce) =>
      minuscolo(voce.nomeIt) === chiave ||
      minuscolo(voce.nomeEn) === chiave ||
      (voce.alias ?? '').split('\n').some((a) => minuscolo(a) === chiave),
  )
  return riga ? esercizioDalCatalogo(tx, userId, riga.id) : null
}
