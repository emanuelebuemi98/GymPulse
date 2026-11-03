import type { Giorno } from './scheda-tipi'
import { db } from './db'
import type { VoceElenco } from './tipi'
import { esercizioDaVoce } from './voci'

const includeVoci = {
  voci: {
    orderBy: { ordine: 'asc' as const },
    include: { esercizio: { include: { catalogo: { select: { nomeEn: true } } } } },
  },
}

// Le giornate della scheda di una persona con i loro esercizi, nell'ordine delle sigle (A, B, C, ...). Quelle tolte dalla
// scheda e rimaste solo per lo storico (attiva = false) non ci sono: lo storico le legge dalle sedute.
export async function leggiScheda(userId: number): Promise<Giorno[]> {
  const righe = await db.giornoScheda.findMany({
    where: { userId, attiva: true },
    orderBy: { id: 'asc' },
    include: includeVoci,
  })
  return righe.map((riga) => ({
    id: riga.id,
    titolo: riga.titolo,
    esercizi: riga.voci.map(esercizioDaVoce),
  }))
}

export async function leggiGiorno(userId: number, id: string): Promise<Giorno | null> {
  const riga = await db.giornoScheda.findUnique({ where: { userId_id: { userId, id } }, include: includeVoci })
  if (!riga || !riga.attiva) return null
  return {
    id: riga.id,
    titolo: riga.titolo,
    esercizi: riga.voci.map(esercizioDaVoce),
  }
}

// Quante sedute sono state registrate su una giornata: serve a dire, prima di toglierla, cosa succede allo storico.
export function contaSeduteGiornata(userId: number, giornoId: string): Promise<number> {
  return db.sessione.count({ where: { userId, giornoId } })
}

// Gli esercizi che una persona può scegliere: i suoi (quelli della scheda, della storia e scritti a mano) e tutti quelli
// del catalogo che non ha ancora usato. Quelli suoi collegati al catalogo non si ripetono come voce del catalogo.
// Ordine alfabetico per nome italiano; `catalogoId` vuoto = esercizio personale.
export async function leggiElenco(userId: number): Promise<VoceElenco[]> {
  // Dal catalogo si leggono solo i campi dell'elenco: i testi lunghi (esecuzione, accortezze) si chiedono a richiesta.
  const [propri, catalogo] = await Promise.all([
    db.esercizio.findMany({
      where: { userId },
      include: { catalogo: { select: { nomeEn: true, muscoloPrincipale: true, alias: true } } },
    }),
    db.catalogoEsercizio.findMany({
      select: { id: true, nomeIt: true, nomeEn: true, categoria: true, muscoloPrincipale: true, alias: true },
    }),
  ])
  const giaUsati = new Set(propri.flatMap((riga) => (riga.catalogoId === null ? [] : [riga.catalogoId])))
  const nomiPropri = new Set(propri.map((riga) => riga.nome.toLowerCase()))

  const elenco: VoceElenco[] = [
    ...propri.map((riga) => ({
      chiave: `e${riga.id}`,
      id: riga.id,
      catalogoId: riga.catalogoId,
      nome: riga.nome,
      nomeEn: riga.catalogo?.nomeEn ?? '',
      categoria: riga.categoria,
      muscolo: riga.catalogo?.muscoloPrincipale ?? '',
      alias: riga.catalogo?.alias ?? '',
    })),
    ...catalogo
      .filter((riga) => !giaUsati.has(riga.id) && !nomiPropri.has(riga.nomeIt.toLowerCase()))
      .map((riga) => ({
        chiave: `c${riga.id}`,
        id: null,
        catalogoId: riga.id,
        nome: riga.nomeIt,
        nomeEn: riga.nomeEn,
        categoria: riga.categoria,
        muscolo: riga.muscoloPrincipale,
        alias: riga.alias ?? '',
      })),
  ]
  return elenco.sort((a, b) => a.nome.localeCompare(b.nome, 'it'))
}
