import { z } from 'zod'
import { blocchi, controllaGruppi, normalizzaGruppi } from './gruppi'
import type { Gruppo, Obiettivo } from './scheda-tipi'
import { RECUPERO_PREDEFINITO } from './voci'

// Regole per la modifica di una giornata della scheda. Il server ricontrolla tutto.

const intero = (min: number, max: number, messaggio: string) =>
  z.number({ error: messaggio }).int(messaggio).min(min, messaggio).max(max, messaggio).nullable()

const voceSchema = z
  .object({
    // Un esercizio è già della persona (esercizioId) oppure preso dal catalogo (catalogoId): uno solo dei due. Non si
    // scrivono più a mano: se la scheda aperta nel browser è di prima (manda ancora nomeNuovo) il salvataggio si ferma.
    esercizioId: z.number().int().positive().max(2_147_483_647).nullable(),
    // Se manca vale "nessuno": una pagina rimasta aperta da prima del catalogo non lo manda.
    catalogoId: z.number().int().positive().max(2_147_483_647).nullable().default(null),
    // Un solo tipo di obiettivo. Una pagina rimasta aperta da prima, che manda ancora «totale» o «libero», si ferma con un messaggio.
    tipo: z.literal('serie', { error: 'Questo tipo di obiettivo non esiste più: apri di nuovo la scheda' }).default('serie'),
    serie: intero(1, 20, 'Le serie devono essere da 1 a 20'),
    ripMin: intero(1, 100, 'Le ripetizioni devono essere da 1 a 100'),
    ripMax: intero(1, 100, 'Le ripetizioni devono essere da 1 a 100'),
    recuperoSec: intero(0, 900, 'Il recupero deve essere da 0 a 900 secondi'),
    // Le ripetizioni di ogni serie (12, 10, 8, 6). Come catalogoId: se manca vale "nessuna", perché una pagina rimasta aperta da
    // prima di questa novità non le manda.
    ripSerie: z
      .array(z.number({ error: 'Le ripetizioni devono essere da 1 a 100' }).int('Le ripetizioni devono essere da 1 a 100').min(1, 'Le ripetizioni devono essere da 1 a 100').max(100, 'Le ripetizioni devono essere da 1 a 100'))
      .max(20, 'Le serie devono essere da 1 a 20')
      .nullable()
      .default(null),
    // Il numero del gruppo (super serie) e il suo recupero. Il numero è solo un'etichetta per dire quali esercizi vanno insieme: il
    // server li rinumera 1, 2, ... Anche questi hanno un valore se mancano.
    gruppo: z.number({ error: 'Super serie non valida' }).int('Super serie non valida').min(1, 'Super serie non valida').max(999, 'Super serie non valida').nullable().default(null),
    recuperoGruppoSec: intero(0, 900, 'Il recupero deve essere da 0 a 900 secondi').default(null),
    nota: z.string().trim().max(120, 'La nota è troppo lunga').nullable(),
    incrementoKg: z
      .number({ error: "L'incremento non è valido" })
      .min(0, "L'incremento non può essere negativo")
      .max(50, "L'incremento è troppo alto")
      .nullable(),
  })
  .refine((v) => (v.esercizioId === null) !== (v.catalogoId === null), {
    message: 'Scegli ogni esercizio dall’elenco: quelli scritti a mano non si salvano più',
  })

const schedaSchema = z.object({
  giornoId: z.string().min(1, 'Giorno mancante'),
  titolo: z.string().trim().min(1, 'Scrivi un titolo').max(60, 'Il titolo è troppo lungo'),
  voci: z.array(voceSchema).min(1, 'Aggiungi almeno un esercizio').max(30, 'Troppi esercizi'),
})

export type VoceNormalizzata = {
  esercizioId: number | null
  catalogoId: number | null
  obiettivo: Obiettivo
  nota: string | null
  incrementoKg: number | null
  // Super serie a cui appartiene (superset, triset, gigantset), oppure nessuna.
  gruppo: Gruppo | null
}

export type SchedaNormalizzata = {
  giornoId: string
  titolo: string
  voci: VoceNormalizzata[]
}

export type EsitoScheda = { ok: true; dati: SchedaNormalizzata } | { ok: false; errore: string }

export function validaScheda(input: unknown): EsitoScheda {
  const parsed = schedaSchema.safeParse(input)
  if (!parsed.success) return { ok: false, errore: parsed.error.issues[0]?.message ?? 'Dati non validi' }

  const { giornoId, titolo, voci } = parsed.data
  const ids = new Set<number>()
  const delCatalogo = new Set<number>()
  const normalizzate: VoceNormalizzata[] = []
  // Il gruppo come arriva dal modulo (numero di etichetta e recupero), da controllare sulla giornata intera.
  const gruppiGrezzi: { gruppo: number | null; recuperoSec: number }[] = []

  for (const voce of voci) {
    if (voce.esercizioId !== null) {
      if (ids.has(voce.esercizioId)) return { ok: false, errore: 'Esercizio ripetuto' }
      ids.add(voce.esercizioId)
    } else if (voce.catalogoId !== null) {
      if (delCatalogo.has(voce.catalogoId)) return { ok: false, errore: 'Esercizio ripetuto' }
      delCatalogo.add(voce.catalogoId)
    }

    let obiettivo: Obiettivo
    if (voce.serie === null || (voce.ripMin === null && (voce.ripSerie === null || voce.ripSerie.length === 0))) {
      return { ok: false, errore: 'Indica serie e ripetizioni di ogni esercizio' }
    }
    // Ripetizioni diverse per ogni serie: una per serie, né più né meno. Il minimo e il massimo si ricavano dall'elenco.
    if (voce.ripSerie !== null && voce.ripSerie.length > 0) {
      if (voce.ripSerie.length !== voce.serie) {
        return { ok: false, errore: 'Scrivi le ripetizioni di ogni serie: tante quante sono le serie' }
      }
      obiettivo = {
        tipo: 'serie',
        serie: voce.serie,
        ripMin: Math.min(...voce.ripSerie),
        ripMax: Math.max(...voce.ripSerie),
        recuperoSec: voce.recuperoSec ?? RECUPERO_PREDEFINITO,
        ripSerie: voce.ripSerie,
      }
    } else {
      if (voce.ripMin === null) return { ok: false, errore: 'Indica serie e ripetizioni di ogni esercizio' }
      const ripMax = voce.ripMax ?? voce.ripMin
      if (ripMax < voce.ripMin) return { ok: false, errore: 'Il massimo delle ripetizioni non può essere sotto il minimo' }
      obiettivo = {
        tipo: 'serie',
        serie: voce.serie,
        ripMin: voce.ripMin,
        ripMax,
        recuperoSec: voce.recuperoSec ?? RECUPERO_PREDEFINITO,
      }
    }

    normalizzate.push({
      esercizioId: voce.esercizioId,
      catalogoId: voce.catalogoId,
      obiettivo,
      nota: voce.nota ? voce.nota : null,
      incrementoKg: voce.incrementoKg ? voce.incrementoKg : null,
      gruppo: null,
    })
    gruppiGrezzi.push({ gruppo: voce.gruppo, recuperoSec: voce.recuperoGruppoSec ?? RECUPERO_PREDEFINITO })
  }

  // Le super serie si controllano sulla giornata intera: esercizi vicini, da 2 a 10, stesso recupero.
  const errore = controllaGruppi(gruppiGrezzi.map((g) => ({ gruppo: g.gruppo })))
  if (errore) return { ok: false, errore }
  for (const blocco of blocchi(gruppiGrezzi)) {
    const recuperi = new Set(gruppiGrezzi.slice(blocco.da, blocco.da + blocco.quanti).map((g) => g.recuperoSec))
    if (recuperi.size > 1) return { ok: false, errore: 'Gli esercizi di una super serie hanno lo stesso recupero' }
  }
  // Numeri 1, 2, ... nell'ordine in cui compaiono, qualunque etichetta sia arrivata.
  const rinumerati = normalizzaGruppi(gruppiGrezzi)
  rinumerati.forEach((g, indice) => {
    normalizzate[indice].gruppo = g.gruppo === null ? null : { numero: g.gruppo, recuperoSec: g.recuperoSec }
  })

  return { ok: true, dati: { giornoId, titolo, voci: normalizzate } }
}
