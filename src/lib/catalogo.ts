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

// Dove sta un esercizio scritto per nome in un file: `esercizioId` se la persona lo ha già, altrimenti `catalogoId` (e
// l'esercizio nasce al salvataggio, con esercizioDalCatalogo). Uno dei due è sempre pieno.
export type EsercizioTrovato = { esercizioId: number | null; catalogoId: number | null; nome: string }

// Cerca molti nomi insieme senza scrivere niente: serve all'anteprima dell'importazione della scheda. Prima tra gli esercizi
// della persona (nome italiano), poi nel catalogo per nome italiano o inglese, senza badare alle maiuscole. Un nome che non si
// trova non compare nel risultato. Se la persona ha già l'esercizio del catalogo trovato, si restituisce il suo.
export async function cercaPerNome(
  tx: Prisma.TransactionClient,
  userId: number,
  nomi: string[],
): Promise<Map<string, EsercizioTrovato>> {
  const [propri, catalogo] = await Promise.all([
    tx.esercizio.findMany({ where: { userId }, select: { id: true, nome: true, catalogoId: true } }),
    tx.catalogoEsercizio.findMany({ select: { id: true, nomeIt: true, nomeEn: true } }),
  ])
  const perNomeProprio = new Map(propri.map((riga) => [minuscolo(riga.nome), riga]))
  const proprioDelCatalogo = new Map(propri.flatMap((riga) => (riga.catalogoId === null ? [] : [[riga.catalogoId, riga] as const])))
  const perNomeCatalogo = new Map<string, (typeof catalogo)[number]>()
  for (const riga of catalogo) {
    perNomeCatalogo.set(minuscolo(riga.nomeEn), riga)
    perNomeCatalogo.set(minuscolo(riga.nomeIt), riga)
  }

  const trovati = new Map<string, EsercizioTrovato>()
  for (const nome of nomi) {
    const chiave = minuscolo(nome)
    if (trovati.has(chiave)) continue
    const proprio = perNomeProprio.get(chiave)
    if (proprio) {
      trovati.set(chiave, { esercizioId: proprio.id, catalogoId: null, nome: proprio.nome })
      continue
    }
    const voce = perNomeCatalogo.get(chiave)
    if (!voce) continue
    const giaSuo = proprioDelCatalogo.get(voce.id)
    trovati.set(
      chiave,
      giaSuo
        ? { esercizioId: giaSuo.id, catalogoId: null, nome: giaSuo.nome }
        : { esercizioId: null, catalogoId: voce.id, nome: voce.nomeIt },
    )
  }
  return trovati
}
