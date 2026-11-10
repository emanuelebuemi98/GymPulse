import type { Prisma } from '@/generated/prisma/client'
import { esercizioDalCatalogo } from './catalogo'
import type { VoceNormalizzata } from './scheda-schema'
import { campiObiettivo } from './voci'

// Scrive gli esercizi di una giornata già esistente: cambia il titolo, toglie le voci di prima e crea quelle nuove, nell'ordine
// dato. La storia non si tocca: le serie già registrate puntano agli esercizi, non alle voci della scheda. Un esercizio è
// della persona oppure del catalogo (lo garantisce la validazione): quello del catalogo nasce qui. Non è un'azione del
// browser: chi la chiama deve già aver controllato di chi è la scheda, e la esegue dentro una transazione.
export async function scriviVoci(
  tx: Prisma.TransactionClient,
  userId: number,
  giornoId: string,
  titolo: string,
  voci: VoceNormalizzata[],
): Promise<void> {
  await tx.giornoScheda.update({ where: { userId_id: { userId, id: giornoId } }, data: { titolo } })
  await tx.voceScheda.deleteMany({ where: { userId, giornoId } })

  let ordine = 0
  for (const voce of voci) {
    const esercizioId = voce.esercizioId ?? (await esercizioDalCatalogo(tx, userId, voce.catalogoId!))
    await tx.voceScheda.create({
      data: {
        userId,
        giornoId,
        esercizioId,
        ordine: ++ordine,
        nota: voce.nota,
        incrementoKg: voce.incrementoKg,
        ...campiObiettivo(voce.obiettivo),
      },
    })
  }
}
