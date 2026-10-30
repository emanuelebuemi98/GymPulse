import type { Prisma } from '@/generated/prisma/client'
import { creaIdEsercizio } from './esercizi'

// Id di un esercizio con questo nome tra quelli della persona (senza badare alle maiuscole), oppure uno nuovo.
export async function trovaOCreaEsercizio(
  tx: Prisma.TransactionClient,
  userId: string,
  nome: string,
): Promise<string> {
  const esistente = await tx.esercizio.findFirst({
    where: { userId, nome: { equals: nome, mode: 'insensitive' } },
    select: { id: true },
  })
  if (esistente) return esistente.id

  const creato = await tx.esercizio.create({
    data: { userId, id: creaIdEsercizio(nome), nome, muscoli: '', personalizzato: true },
    select: { id: true },
  })
  return creato.id
}
