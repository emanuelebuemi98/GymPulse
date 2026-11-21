import type { Prisma } from '@/generated/prisma/client'
import { cercaPerNome } from './catalogo'
import { macchinaCardio, partenzaCardio, TRATTO_PREDEFINITO_SEC } from './cardio'
import { èATempo, èCardio } from './categorie'
import { leggiCsvScheda, type RigaScheda } from './csv-scheda'
import { GIORNATE_MASSIME, prossimaSigla, titoloGiornata } from './giornate'
import { controllaSuperSerie, scriviVoci } from './scheda-scrittura'
import { validaScheda, type VoceNormalizzata } from './scheda-schema'
import { DURATA_PREDEFINITA, RECUPERO_PREDEFINITO_TEMPO } from './voci'

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

// `perAltri`: la scheda è di un'altra persona (un allievo del personal trainer che importa). I messaggi non parlano di «tuoi» esercizi
// e non dicono che una lettera ha lo storico: sono dati che il trainer non deve vedere.
export async function pianoImportScheda(
  tx: Prisma.TransactionClient,
  userId: number,
  testo: string,
  perAltri = false,
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
      errore: `Questi esercizi non ci sono né ${perAltri ? 'tra gli esercizi di questa persona' : 'tra i tuoi'} né nel catalogo: ${elenco}${altri}. Non importo niente: correggi i nomi nel file (meglio ancora, parti dal file del catalogo) e riprova.`,
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
      // Per un'altra persona non si dice perché: che la giornata abbia uno storico è un dato che il trainer non deve vedere.
      return {
        ok: false,
        errore: perAltri
          ? `La giornata ${lettera} non si può usare in questa scheda: scrivi un'altra lettera nel file`
          : `La giornata ${lettera} è stata tolta dalla scheda e resta solo per lo storico: usa un'altra lettera`,
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
      // Gli esercizi a tempo (isometria) hanno una durata al posto delle ripetizioni: se il file non la scrive vale quella
      // predefinita; e una durata su un esercizio che non è a tempo è un errore, non si ignora in silenzio. Il cardio si fa a tratti:
      // le serie sono i tratti, la durata è quella di ognuno e, sulle macchine con la velocità, c'è la velocità (e la pendenza).
      const cardio = èCardio(dove.categoria)
      const aTempo = èATempo(dove.categoria) || cardio
      const macchina = cardio ? macchinaCardio(dove.nomeEn) : null
      const partenza = cardio ? partenzaCardio(dove.nomeEn) : null
      if (riga.durataSec !== null && !aTempo) {
        return {
          ok: false,
          errore: `Riga ${riga.riga}: la durata (durata_sec) si scrive solo per gli esercizi di isometria e di cardio, e «${dove.nome}» non lo è: usa le ripetizioni`,
        }
      }
      if (!cardio && (riga.velocitaKmh !== null || riga.inclinazionePct !== null)) {
        return {
          ok: false,
          errore: `Riga ${riga.riga}: la velocità e la pendenza si scrivono solo per il cardio, e «${dove.nome}» non lo è`,
        }
      }
      if (cardio && !macchina && riga.velocitaKmh !== null) {
        return {
          ok: false,
          errore: `Riga ${riga.riga}: «${dove.nome}» non ha la velocità: cancella velocita_kmh e scrivi solo i tratti e la durata`,
        }
      }
      if (cardio && !macchina?.pendenza && riga.inclinazionePct !== null) {
        return {
          ok: false,
          errore: `Riga ${riga.riga}: «${dove.nome}» non ha la pendenza: cancella inclinazione_pct`,
        }
      }
      const voce = {
        esercizioId: dove.esercizioId,
        catalogoId: dove.catalogoId,
        // Un cardio senza durata (un file di prima) è un solo tratto da 20 minuti: le sue «serie 3 × 8-10» non avevano senso.
        serie: cardio ? (riga.durataSec === null ? 1 : (riga.serie ?? 1)) : (riga.serie ?? 3),
        ripMin: aTempo ? null : riga.ripMin,
        ripMax: aTempo ? null : riga.ripMax,
        recuperoSec: cardio ? 0 : (riga.recuperoSec ?? (aTempo ? RECUPERO_PREDEFINITO_TEMPO : null)),
        nota: riga.nota,
        incrementoKg: aTempo ? null : riga.incrementoKg,
        ripSerie: aTempo ? null : riga.ripSerie,
        durataSec: cardio ? (riga.durataSec ?? TRATTO_PREDEFINITO_SEC) : aTempo ? (riga.durataSec ?? DURATA_PREDEFINITA) : null,
        velocitaKmh: macchina && partenza ? (riga.velocitaKmh ?? partenza.velocitaKmh) : null,
        inclinazionePct: macchina?.pendenza && partenza ? (riga.inclinazionePct ?? partenza.inclinazionePct) : null,
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
        ...datiObiettivo(voce),
        nota: voce.nota,
        incrementoKg: voce.incrementoKg,
        gruppo: righe[indice].gruppo === null ? null : numeri.get(righe[indice].gruppo!)!,
        recuperoGruppoSec: righe[indice].gruppo === null ? null : (recuperi.get(righe[indice].gruppo!) ?? null),
      })),
    })
    if (!intera.ok) return { ok: false, errore: `Giornata ${lettera}: ${minuscola(intera.errore)}` }
    // Isometria, cardio e stretching non stanno in una super serie: si guarda la categoria vera, nel database.
    const superSerieSbagliata = await controllaSuperSerie(tx, userId, intera.dati.voci)
    if (superSerieSbagliata) return { ok: false, errore: `Giornata ${lettera}: ${minuscola(superSerieSbagliata)}` }

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

// Per l'anteprima: cosa cambierebbe in ogni giornata, senza i dati da scrivere.
export function riepilogoPiano(giornate: GiornataDaScrivere[]) {
  return giornate.map((giornata) => ({
    id: giornata.id,
    titolo: giornata.titolo,
    nuova: giornata.nuova,
    eserciziPrima: giornata.eserciziPrima,
    eserciziDopo: giornata.voci.length,
  }))
}

export type EsitoImportScheda = { giornate: number; esercizi: number; nuove: number } | { errore: string }

// Scrive il piano nel database, dentro la transazione `tx`: rifà le giornate del file nella scheda di `userId`. `chi` è chi la sta
// cambiando (la persona stessa, oppure il suo personal trainer): finisce in «Modificata da». Il blocco per persona fa passare una
// richiesta alla volta, così due importazioni insieme non creano la stessa giornata due volte. Il piano si rifà qui dentro, con i
// dati di questo momento: tra l'anteprima e la conferma la scheda può essere cambiata. Chi chiama deve già aver controllato di chi
// è la scheda e chi la sta cambiando, e aver fatto vedere l'anteprima.
export async function scriviImportScheda(
  tx: Prisma.TransactionClient,
  userId: number,
  chi: number,
  testo: string,
  perAltri = false,
): Promise<EsitoImportScheda> {
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(${userId}::bigint)`

  const piano = await pianoImportScheda(tx, userId, testo, perAltri)
  if (!piano.ok) return { errore: piano.errore }

  for (const giornata of piano.giornate) {
    if (giornata.nuova) await tx.giornoScheda.create({ data: { userId, id: giornata.id, titolo: giornata.titolo } })
    await scriviVoci(tx, userId, giornata.id, giornata.titolo, giornata.voci, chi)
  }
  return {
    giornate: piano.giornate.length,
    esercizi: piano.giornate.reduce((somma, g) => somma + g.voci.length, 0),
    nuove: piano.giornate.filter((g) => g.nuova).length,
  }
}

const minuscola = (testo: string) => testo.charAt(0).toLowerCase() + testo.slice(1)

// Le colonne dell'obiettivo come le vuole validaScheda, prese dalla voce già controllata riga per riga: così i valori che l'importazione
// ha scelto (la durata e il recupero di un esercizio a tempo, le ripetizioni di quelli normali) restano gli stessi nel controllo
// della giornata intera.
function datiObiettivo(voce: VoceNormalizzata) {
  const o = voce.obiettivo
  return {
    serie: o.serie,
    ripMin: o.ripMin,
    ripMax: o.ripMax,
    recuperoSec: o.recuperoSec,
    ripSerie: o.ripSerie ?? null,
    durataSec: o.durataSec ?? null,
    velocitaKmh: o.velocitaKmh ?? null,
    inclinazionePct: o.inclinazionePct ?? null,
  }
}
