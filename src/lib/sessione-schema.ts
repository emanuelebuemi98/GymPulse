import { z } from 'zod'
import { istanteDaData } from './formato'

// Regole per una sessione registrata. Il browser non è fidato: il server ricontrolla tutto.

const serieSchema = z.object({
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

// Un esercizio della scheda o del catalogo (esercizioId) oppure uno nuovo (nomeNuovo): mai entrambi.
const esercizioSchema = z
  .object({
    esercizioId: z.number().int().positive().max(2_147_483_647).nullable(),
    nomeNuovo: z.string().trim().min(1, 'Nome esercizio mancante').max(60, 'Nome esercizio troppo lungo').nullable(),
    serie: z.array(serieSchema).max(50, 'Troppe serie per un esercizio'),
  })
  .refine((e) => (e.esercizioId === null) !== (e.nomeNuovo === null), { message: 'Esercizio non valido' })

const sessioneSchema = z.object({
  giornoId: z.string().min(1, 'Giorno mancante'),
  data: z.string(),
  note: z.string().trim().max(500, 'Le note sono troppo lunghe').nullable(),
  durataMinuti: z
    .number({ error: 'Durata non valida' })
    .int('La durata deve essere in minuti interi')
    .min(1, 'La durata deve essere di almeno 1 minuto')
    .max(600, 'Durata troppo lunga')
    .nullable(),
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
  const nomi = new Set<string>()
  for (const esercizio of dati.esercizi) {
    if (esercizio.esercizioId !== null) {
      if (ids.has(esercizio.esercizioId)) return { ok: false, errore: 'Esercizio ripetuto' }
      ids.add(esercizio.esercizioId)
    } else {
      const nome = esercizio.nomeNuovo!.toLowerCase()
      if (nomi.has(nome)) return { ok: false, errore: 'Esercizio ripetuto' }
      nomi.add(nome)
    }
  }

  if (dati.esercizi.every((esercizio) => esercizio.serie.length === 0)) {
    return { ok: false, errore: 'Conferma almeno una serie' }
  }

  return { ok: true, dati, istante }
}
