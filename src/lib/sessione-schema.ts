import { z } from 'zod'
import { DURATA_MASSIMA_SECONDI } from './durata'
import { istanteDaData } from './formato'

// Regole per una sessione registrata. Il browser non è fidato: il server ricontrolla tutto.

export const serieSchema = z
  .object({
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
    // I secondi tenuti in una serie a tempo (isometria). Se manca vale "nessuno": una pagina rimasta aperta da prima non lo manda.
    durataSec: z
      .number({ error: 'Durata non valida' })
      .int('La durata deve essere in secondi interi')
      .min(1, 'La durata deve essere di almeno 1 secondo')
      .max(3600, 'Durata troppo lunga')
      .nullable()
      .default(null),
    // Un tratto di cardio: velocità, pendenza, km, calorie e battiti medi. Tutti facoltativi, e se mancano valgono "nessuno" (una pagina
    // rimasta aperta da prima non li manda). Con la velocità, km e calorie si ricalcolano sul server e quelli del browser non contano.
    velocitaKmh: z
      .number({ error: 'La velocità deve essere da 0,5 a 30 km/h' })
      .min(0.5, 'La velocità deve essere da 0,5 a 30 km/h')
      .max(30, 'La velocità deve essere da 0,5 a 30 km/h')
      .nullable()
      .default(null),
    inclinazionePct: z
      .number({ error: 'La pendenza deve essere da 0 a 40%' })
      .min(0, 'La pendenza deve essere da 0 a 40%')
      .max(40, 'La pendenza deve essere da 0 a 40%')
      .nullable()
      .default(null),
    km: z
      .number({ error: 'I km non sono validi' })
      .min(0, 'I km non possono essere negativi')
      .max(500, 'I km sono troppi')
      .nullable()
      .default(null),
    kcal: z
      .number({ error: 'Le calorie non sono valide' })
      .int('Le calorie devono essere un numero intero')
      .min(0, 'Le calorie non possono essere negative')
      .max(5000, 'Le calorie sono troppe')
      .nullable()
      .default(null),
    bpm: z
      .number({ error: 'I battiti non sono validi' })
      .int('I battiti devono essere un numero intero')
      .min(30, 'I battiti devono essere da 30 a 250 al minuto')
      .max(250, 'I battiti devono essere da 30 a 250 al minuto')
      .nullable()
      .default(null),
  })
  // Una serie a tempo (tenuta o tratto di cardio) conta come una ripetizione e non ha peso: lo chiede anche il database.
  .refine((s) => s.durataSec === null || (s.ripetizioni === 1 && s.pesoKg === null), {
    message: 'Una serie a tempo non ha peso né ripetizioni',
  })
  // I dati del tratto stanno solo con la durata, e la pendenza solo con la velocità (come i controlli del database).
  .refine(
    (s) => s.durataSec !== null || (s.velocitaKmh === null && s.inclinazionePct === null && s.km === null && s.kcal === null && s.bpm === null),
    { message: 'Velocità, km, calorie e battiti si scrivono solo per un tratto con la sua durata' },
  )
  .refine((s) => s.inclinazionePct === null || s.velocitaKmh !== null, { message: 'La pendenza si scrive solo insieme alla velocità' })

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

// Note e durata hanno le stesse regole quando la seduta arriva dal form e quando arriva da un file CSV. La durata è in secondi.
export const noteSchema = z.string().trim().max(500, 'Le note sono troppo lunghe').nullable()
export const durataSchema = z
  .number({ error: 'Durata non valida' })
  .int('La durata deve essere in secondi interi')
  .min(1, 'La durata deve essere di almeno 1 secondo')
  .max(DURATA_MASSIMA_SECONDI, 'Durata troppo lunga')
  .nullable()

const sessioneSchema = z.object({
  giornoId: z.string().min(1, 'Giorno mancante'),
  data: z.string(),
  note: noteSchema,
  durataSecondi: durataSchema,
  // Il peso di quel giorno, serve a stimare le calorie del cardio. Se manca vale "nessuno".
  pesoCorporeoKg: z
    .number({ error: 'Il peso deve essere da 20 a 400 kg' })
    .min(20, 'Il peso deve essere da 20 a 400 kg')
    .max(400, 'Il peso deve essere da 20 a 400 kg')
    .nullable()
    .default(null),
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
