import type { Prisma } from '@/generated/prisma/client'
import { cercaPerNome } from './catalogo'
import { leggiCsvScheda, type RigaScheda } from './csv-scheda'
import { GIORNATE_MASSIME, prossimaSigla, titoloGiornata } from './giornate'
import { validaScheda, type VoceNormalizzata } from './scheda-schema'

// Dal file CSV della scheda a quello che si scriverebbe nel database, senza scrivere niente. Lo usano l'anteprima (che fa
// vedere cosa cambia) e l'importazione vera (che lo rifà dentro la transazione, con i dati di quel momento).
//
// Regole:
// - Ogni giornata che compare nel file viene RIFATTA: i suoi esercizi di prima si tolgono e al loro posto vanno quelli del
//   file, nell'ordine in cui sono scritti. Le giornate che nel file non compaiono non si toccano.
// - Una giornata che non esiste ancora si crea, ma solo se è la lettera successiva all'ultima (A, B, C, ... senza salti) e
//   se la scheda resta entro 7 giornate. Una giornata tolta dalla scheda (rimasta per lo storico) non si riusa.
// - Gli esercizi si ritrovano per nome (italiano o inglese) tra i tuoi e nel catalogo. Se anche un solo nome non si trova non
//   si importa niente e si elencano tutti quelli mancanti.
// - Storico e sedute non si toccano mai: le serie già registrate puntano agli esercizi, non alle voci della scheda.

export type GiornataDaScrivere = {
  id: string
  titolo: string
  nuova: boolean
  eserciziPrima: number
  voci: VoceNormalizzata[]
}

export type PianoImportScheda = { ok: true; giornate: GiornataDaScrivere[] } | { ok: false; errore: string }

const MAX_MANCANTI_MOSTRATI = 10

export async function pianoImportScheda(
  tx: Prisma.TransactionClient,
  userId: number,
  testo: string,
): Promise<PianoImportScheda> {
  const letto = leggiCsvScheda(testo)
  if (!letto.ok) return letto

  // Le righe per giornata, nell'ordine del file; le giornate in ordine di lettera.
  const perGiornata = new Map<string, RigaScheda[]>()
  for (const riga of letto.righe) perGiornata.set(riga.giornata, [...(perGiornata.get(riga.giornata) ?? []), riga])
  const lettere = [...perGiornata.keys()].sort()

  const trovati = await cercaPerNome(tx, userId, letto.righe.map((riga) => riga.nome))
  const mancanti = new Map<string, string>()
  for (const riga of letto.righe) {
    if (!trovati.has(riga.nome.trim().toLowerCase())) mancanti.set(riga.nome.trim().toLowerCase(), riga.nome)
  }
  if (mancanti.size > 0) {
    const elenco = [...mancanti.values()].slice(0, MAX_MANCANTI_MOSTRATI).map((nome) => `"${nome}"`).join(', ')
    const altri = mancanti.size > MAX_MANCANTI_MOSTRATI ? ` e altri ${mancanti.size - MAX_MANCANTI_MOSTRATI}` : ''
    return {
      ok: false,
      errore: `Questi esercizi non ci sono né tra i tuoi né nel catalogo: ${elenco}${altri}. Non importo niente: correggi i nomi nel file (meglio ancora, parti dal file del catalogo) e riprova.`,
    }
  }

  const esistenti = await tx.giornoScheda.findMany({
    where: { userId },
    select: { id: true, titolo: true, attiva: true, _count: { select: { voci: true } } },
  })
  const perLettera = new Map(esistenti.map((giorno) => [giorno.id, giorno]))

  // Le giornate nuove: una per volta, e ognuna deve essere la lettera che verrebbe dopo.
  const sigle = esistenti.map((giorno) => giorno.id)
  let attive = esistenti.filter((giorno) => giorno.attiva).length
  for (const lettera of lettere) {
    const giorno = perLettera.get(lettera)
    if (giorno && !giorno.attiva) {
      return {
        ok: false,
        errore: `La giornata ${lettera} è stata tolta dalla scheda e resta solo per lo storico: usa un'altra lettera`,
      }
    }
    if (giorno) continue
    const prossima = prossimaSigla(sigle)
    if (prossima !== lettera) {
      return {
        ok: false,
        errore: prossima
          ? `La giornata ${lettera} non esiste: la prossima che si può creare è la ${prossima}. Cambia la lettera nel file`
          : 'Non ci sono più lettere disponibili per le giornate',
      }
    }
    attive += 1
    if (attive > GIORNATE_MASSIME) return { ok: false, errore: `Una scheda può avere al massimo ${GIORNATE_MASSIME} giornate` }
    sigle.push(lettera)
  }

  const giornate: GiornataDaScrivere[] = []
  for (const lettera of lettere) {
    const righe = perGiornata.get(lettera)!
    const esistente = perLettera.get(lettera)
    const titolo = righe.find((riga) => riga.titolo !== null)?.titolo ?? esistente?.titolo ?? titoloGiornata(lettera)

    const voci: VoceNormalizzata[] = []
    for (const riga of righe) {
      const dove = trovati.get(riga.nome.trim().toLowerCase())!
      const voce = {
        esercizioId: dove.esercizioId,
        catalogoId: dove.catalogoId,
        serie: riga.serie,
        ripMin: riga.ripMin,
        ripMax: riga.ripMax,
        recuperoSec: riga.recuperoSec,
        nota: riga.nota,
        incrementoKg: riga.incrementoKg,
        ripSerie: riga.ripSerie,
      }
      // Prima ogni riga da sola, così l'errore dice quale riga del file è sbagliata.
      const singola = validaScheda({ giornoId: lettera, titolo, voci: [voce] })
      if (!singola.ok) return { ok: false, errore: `Riga ${riga.riga}: ${minuscola(singola.errore)}` }
      voci.push(singola.dati.voci[0])
    }

    // Le super serie: le righe con la stessa etichetta vanno insieme. L'etichetta diventa un numero (1, 2, …) nell'ordine in cui
    // compare; il recupero è quello scritto su una delle righe del gruppo (se due righe ne scrivono di diversi, è un errore).
    const numeri = new Map<string, number>()
    const recuperi = new Map<string, number>()
    for (const riga of righe) {
      if (riga.gruppo === null) continue
      if (!numeri.has(riga.gruppo)) numeri.set(riga.gruppo, numeri.size + 1)
      if (riga.recuperoGruppoSec === null) continue
      const scritto = recuperi.get(riga.gruppo)
      if (scritto !== undefined && scritto !== riga.recuperoGruppoSec) {
        return {
          ok: false,
          errore: `Riga ${riga.riga}: il recupero del gruppo "${riga.gruppo}" è diverso da quello scritto nelle altre righe dello stesso gruppo`,
        }
      }
      recuperi.set(riga.gruppo, riga.recuperoGruppoSec)
    }

    // Poi la giornata intera: esercizi ripetuti, troppi esercizi, super serie.
    const intera = validaScheda({
      giornoId: lettera,
      titolo,
      voci: voci.map((voce, indice) => ({
        esercizioId: voce.esercizioId,
        catalogoId: voce.catalogoId,
        ...datiObiettivo(voce, righe[indice]),
        nota: voce.nota,
        incrementoKg: voce.incrementoKg,
        gruppo: righe[indice].gruppo === null ? null : numeri.get(righe[indice].gruppo!)!,
        recuperoGruppoSec: righe[indice].gruppo === null ? null : (recuperi.get(righe[indice].gruppo!) ?? null),
      })),
    })
    if (!intera.ok) return { ok: false, errore: `Giornata ${lettera}: ${minuscola(intera.errore)}` }

    giornate.push({
      id: lettera,
      titolo: intera.dati.titolo,
      nuova: esistente === undefined,
      eserciziPrima: esistente?._count.voci ?? 0,
      voci: intera.dati.voci,
    })
  }

  return { ok: true, giornate }
}

const minuscola = (testo: string) => testo.charAt(0).toLowerCase() + testo.slice(1)

// Le colonne dell'obiettivo come le vuole validaScheda, prese dalla riga del file.
function datiObiettivo(_voce: VoceNormalizzata, riga: RigaScheda) {
  return {
    serie: riga.serie,
    ripMin: riga.ripMin,
    ripMax: riga.ripMax,
    recuperoSec: riga.recuperoSec,
    ripSerie: riga.ripSerie,
  }
}
