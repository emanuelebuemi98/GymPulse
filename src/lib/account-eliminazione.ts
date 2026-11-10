import type { Prisma } from '@/generated/prisma/client'

// Cancella un account con tutto ciò che gli appartiene. Non è un'azione del browser (ogni export di un file 'use server' è
// un indirizzo pubblico): la usa src/app/account/actions.ts dopo aver controllato la password. Si esegue dentro una
// transazione: o sparisce tutto o non cambia niente.
//
// L'ordine è esplicito e va dal dato più "in fondo" al più in alto. Le chiavi esterne verso User sono quasi tutte a cascata, ma tre
// collegamenti (voce → esercizio, serie → esercizio, seduta → giornata) non lo sono: con la cascata di Postgres di solito funziona
// perché tutto sparisce nella stessa istruzione, ma dipende dall'ordine dei controlli interni. Non ci si affida.
//
// Le schede di ALTRE persone che questo account ha modificato (un personal trainer) non si toccano: sono loro. Il database mette
// vuoto il nome di chi le ha modificate (GiornoScheda.modificatoDaId è ON DELETE SET NULL), e per esattezza lo si fa qui.

export type DatiEliminati = {
  serie: number
  sedute: number
  voci: number
  giornate: number
  esercizi: number
  codici: number
}

export async function eliminaDatiUtente(tx: Prisma.TransactionClient, userId: number): Promise<DatiEliminati> {
  // Lo stesso blocco per persona usato per scrivere la scheda (lib/scheda-scrittura.ts): un salvataggio in corso, anche di un
  // personal trainer sulla scheda di questa persona, finisce prima o viene rifiutato dopo, e non lascia righe a metà.
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(${userId}::bigint)`

  // Se l'account è stato già cancellato (due richieste insieme) non c'è niente da fare e lo si dice.
  const esiste = await tx.user.findUnique({ where: { id: userId }, select: { id: true } })
  if (!esiste) throw new Error('ACCOUNT_GIA_ELIMINATO')

  await tx.giornoScheda.updateMany({ where: { modificatoDaId: userId, NOT: { userId } }, data: { modificatoDaId: null } })

  const serie = await tx.serieEseguita.deleteMany({ where: { userId } })
  const sedute = await tx.sessione.deleteMany({ where: { userId } })
  const voci = await tx.voceScheda.deleteMany({ where: { userId } })
  const giornate = await tx.giornoScheda.deleteMany({ where: { userId } })
  const esercizi = await tx.esercizio.deleteMany({ where: { userId } })
  const codici = await tx.codiceEmail.deleteMany({ where: { userId } })
  await tx.user.delete({ where: { id: userId } })

  return {
    serie: serie.count,
    sedute: sedute.count,
    voci: voci.count,
    giornate: giornate.count,
    esercizi: esercizi.count,
    codici: codici.count,
  }
}
