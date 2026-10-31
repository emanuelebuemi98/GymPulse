import type { Prisma } from '@/generated/prisma/client'

// Id di un esercizio con questo nome tra quelli della persona (senza badare alle maiuscole), oppure uno nuovo.
export async function trovaOCreaEsercizio(
  tx: Prisma.TransactionClient,
  userId: number,
  nome: string,
): Promise<number> {
  const esistente = await tx.esercizio.findFirst({
    where: { userId, nome: { equals: nome, mode: 'insensitive' } },
    select: { id: true },
  })
  if (esistente) return esistente.id

  const creato = await tx.esercizio.create({
    data: { userId, nome, muscoli: '' },
    select: { id: true },
  })
  return creato.id
}
