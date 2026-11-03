import { z } from 'zod'
import { istanteDaData } from './formato'

// Regole per una sessione registrata. Il browser non è fidato: il server ricontrolla tutto.

export const serieSchema = z.object({
  pesoKg: z
    .number({ error: 'Peso non valido' })
    .min(0, 'Il peso non può essere negativo')
    .max(500, 'Peso troppo alto')
    .nullable(),
  ripetizioni: z
    .number({ error: 'Ripetizioni non valide' })
    .int('Le ripetizioni devono essere un numero intero')
    .min(1, 'Almeno una ripetizione')
    .max(999, 'Ripetizioni troppo alte'),
})

// Un esercizio già della persona (esercizioId) oppure preso dal catalogo (catalogoId): uno solo dei due. Gli esercizi non
// si scrivono più a mano.
const esercizioSchema = z
  .object({
    esercizioId: z.number().int().positive().max(2_147_483_647).nullable(),
    // Se manca vale "nessuno": una pagina rimasta aperta da prima del catalogo non lo manda.
    catalogoId: z.number().int().positive().max(2_147_483_647).nullable().default(null),
    serie: z.array(serieSchema).max(50, 'Troppe serie per un esercizio'),
  })
  .refine((e) => (e.esercizioId === null) !== (e.catalogoId === null), {
    message: 'Scegli ogni esercizio dall’elenco: quelli scritti a mano non si salvano più',
  })

// Note e durata hanno le stesse regole quando la seduta arriva dal form e quando arriva da un file CSV.
export const noteSchema = z.string().trim().max(500, 'Le note sono troppo lunghe').nullable()
export const durataSchema = z
  .number({ error: 'Durata non valida' })
  .int('La durata deve essere in minuti interi')
  .min(1, 'La durata deve essere di almeno 1 minuto')
  .max(600, 'Durata troppo lunga')
  .nullable()

const sessioneSchema = z.object({
  giornoId: z.string().min(1, 'Giorno mancante'),
  data: z.string(),
  note: noteSchema,
  durataMinuti: durataSchema,
  esercizi: z.array(esercizioSchema).max(50),
})

export type SessioneInput = z.infer<typeof sessioneSchema>
export type EsitoValidazione =
  | { ok: true; dati: SessioneInput; istante: Date }
  | { ok: false; errore: string }

export function validaSessione(input: unknown, ora = new Date()): EsitoValidazione {
  const parsed = sessioneSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, errore: parsed.error.issues[0]?.message ?? 'Dati non validi' }
  }

  const dati = parsed.data
  const istante = istanteDaData(dati.data, ora)
  if (!istante) return { ok: false, errore: 'La data non è valida o è nel futuro' }

  const ids = new Set<number>()
  const delCatalogo = new Set<number>()
  for (const esercizio of dati.esercizi) {
    if (esercizio.esercizioId !== null) {
      if (ids.has(esercizio.esercizioId)) return { ok: false, errore: 'Esercizio ripetuto' }
      ids.add(esercizio.esercizioId)
    } else if (esercizio.catalogoId !== null) {
      if (delCatalogo.has(esercizio.catalogoId)) return { ok: false, errore: 'Esercizio ripetuto' }
      delCatalogo.add(esercizio.catalogoId)
    }
  }

  if (dati.esercizi.every((esercizio) => esercizio.serie.length === 0)) {
    return { ok: false, errore: 'Conferma almeno una serie' }
  }

  return { ok: true, dati, istante }
}
