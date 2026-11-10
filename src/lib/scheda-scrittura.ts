import type { Prisma } from '@/generated/prisma/client'
import { esercizioDalCatalogo } from './catalogo'
import { GIORNATE_MASSIME, prossimaSigla, titoloGiornata } from './giornate'
import type { SchedaNormalizzata, VoceNormalizzata } from './scheda-schema'
import { campiObiettivo } from './voci'

// Come si scrive la scheda di una persona. Le usano sia l'utente (la sua scheda) sia un personal trainer (quella di un utente
// della sua palestra): per questo NON sono azioni del browser. Ogni export di un file 'use server' è un indirizzo pubblico,
// quindi queste funzioni vivono qui, e chi le chiama (src/app/actions.ts, src/app/trainer/actions.ts) deve già aver controllato
// di chi è la scheda e chi la sta modificando. Si eseguono dentro una transazione.
//
// `userId` è la persona DI CUI È la scheda; `chi` è chi la modifica (lo stesso userId, oppure il trainer). Il blocco per persona
// (pg_advisory_xact_lock) fa passare una richiesta alla volta: due salvataggi insieme non si pestano i piedi, e due "Aggiungi"
// non scelgono la stessa sigla.

export type Esito<T> = ({ ok: true } & T) | { ok: false; errore: string }

// Scrive gli esercizi di una giornata già esistente: cambia il titolo, toglie le voci di prima e crea quelle nuove, nell'ordine
// dato. La storia non si tocca: le serie già registrate puntano agli esercizi, non alle voci della scheda. Un esercizio è
// della persona oppure del catalogo (lo garantisce la validazione): quello del catalogo nasce qui.
export async function scriviVoci(
  tx: Prisma.TransactionClient,
  userId: number,
  giornoId: string,
  titolo: string,
  voci: VoceNormalizzata[],
  chi: number = userId,
): Promise<void> {
  await tx.giornoScheda.update({
    where: { userId_id: { userId, id: giornoId } },
    data: { titolo, modificatoDaId: chi, modificatoIl: new Date() },
  })
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

// Salva una giornata. `versione` è il momento dell'ultima modifica che la pagina ha letto (ISO, o null se la giornata non era mai
// stata modificata): se nel frattempo qualcun altro l'ha cambiata, si rifiuta invece di sovrascriverla in silenzio.
export async function salvaGiornata(
  tx: Prisma.TransactionClient,
  userId: number,
  chi: number,
  scheda: SchedaNormalizzata,
  versione: string | null,
): Promise<Esito<object>> {
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(${userId}::bigint)`

  const giorno = await tx.giornoScheda.findFirst({
    where: { userId, id: scheda.giornoId, attiva: true },
    select: { modificatoIl: true, modificatoDa: { select: { fullName: true } } },
  })
  if (!giorno) return { ok: false, errore: 'Giornata non trovata' }

  const attuale = giorno.modificatoIl ? giorno.modificatoIl.toISOString() : null
  if (attuale !== versione) {
    const chiHaModificato = giorno.modificatoDa?.fullName
    return {
      ok: false,
      errore: `La scheda è stata modificata${chiHaModificato ? ` da ${chiHaModificato}` : ''} mentre la stavi cambiando: ricarica la pagina e riprova`,
    }
  }

  const idPropri = scheda.voci.flatMap((voce) => (voce.esercizioId !== null ? [voce.esercizioId] : []))
  const trovati = await tx.esercizio.count({ where: { userId, id: { in: idPropri } } })
  if (trovati !== idPropri.length) return { ok: false, errore: 'Un esercizio non esiste più' }
  const idCatalogo = scheda.voci.flatMap((voce) => (voce.catalogoId !== null ? [voce.catalogoId] : []))
  if ((await tx.catalogoEsercizio.count({ where: { id: { in: idCatalogo } } })) !== idCatalogo.length) {
    return { ok: false, errore: 'Un esercizio del catalogo non esiste più' }
  }

  // Un esercizio già nella persona e lo stesso preso dal catalogo sono la stessa voce: la validazione non li vede come doppi
  // (uno ha esercizioId, l'altro catalogoId), il database sì. Meglio dirlo qui che lasciar fallire la scrittura.
  const delCatalogo = scheda.voci.flatMap((voce) => (voce.catalogoId !== null ? [voce.catalogoId] : []))
  if (delCatalogo.length > 0 && idPropri.length > 0) {
    const gia = await tx.esercizio.count({ where: { userId, id: { in: idPropri }, catalogoId: { in: delCatalogo } } })
    if (gia > 0) return { ok: false, errore: 'Esercizio ripetuto' }
  }

  await scriviVoci(tx, userId, scheda.giornoId, scheda.titolo, scheda.voci, chi)
  return { ok: true }
}

// Aggiunge una giornata in fondo alla scheda, con la sigla successiva (A, B, C, D, ...), fino a 7. Parte vuota: gli esercizi si
// scelgono dalla pagina di modifica.
export async function creaGiornata(tx: Prisma.TransactionClient, userId: number, chi: number): Promise<Esito<{ id: string }>> {
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(${userId}::bigint)`

  // Si contano solo le attive per il limite; le sigle invece si guardano tutte, tolte comprese, perché non si riusano.
  const tutte = await tx.giornoScheda.findMany({ where: { userId }, select: { id: true, attiva: true } })
  if (tutte.filter((g) => g.attiva).length >= GIORNATE_MASSIME) {
    return { ok: false, errore: `Una scheda può avere al massimo ${GIORNATE_MASSIME} giornate` }
  }
  const sigla = prossimaSigla(tutte.map((g) => g.id))
  if (sigla === null) return { ok: false, errore: 'Non ci sono più sigle disponibili' }

  await tx.giornoScheda.create({
    data: { userId, id: sigla, titolo: titoloGiornata(sigla), modificatoDaId: chi, modificatoIl: new Date() },
  })
  return { ok: true, id: sigla }
}

// Toglie una giornata dalla scheda. Una scheda ha sempre almeno una giornata. Se la giornata non ha sedute si cancella; se ne ha,
// si segna come non attiva e resta solo per lo storico: le sedute già registrate non si perdono. Chi chiama deve avere chiesto
// conferma. Il risultato non dice quante sedute ci sono: chi toglie la giornata per un'altra persona non deve vederlo.
export async function togliGiornata(
  tx: Prisma.TransactionClient,
  userId: number,
  id: string,
): Promise<Esito<{ archiviata: boolean }>> {
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(${userId}::bigint)`

  const attive = await tx.giornoScheda.findMany({ where: { userId, attiva: true }, select: { id: true } })
  if (!attive.some((g) => g.id === id)) return { ok: false, errore: 'Giornata non trovata' }
  if (attive.length <= 1) return { ok: false, errore: 'Una scheda ha sempre almeno una giornata' }

  // Le voci della giornata tolta non servono più in nessun caso.
  await tx.voceScheda.deleteMany({ where: { userId, giornoId: id } })
  const sedute = await tx.sessione.count({ where: { userId, giornoId: id } })
  if (sedute > 0) {
    await tx.giornoScheda.update({ where: { userId_id: { userId, id } }, data: { attiva: false } })
    return { ok: true, archiviata: true }
  }
  await tx.giornoScheda.delete({ where: { userId_id: { userId, id } } })
  return { ok: true, archiviata: false }
}
