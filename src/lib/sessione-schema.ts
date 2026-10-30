import { z } from 'zod'
import { trovaGiorno } from '../data/scheda'

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

const sessioneSchema = z.object({
  giornoId: z.string().min(1, 'Giorno mancante'),
  durataMinuti: z
    .number({ error: 'Durata non valida' })
    .int('La durata deve essere in minuti interi')
    .min(1, 'La durata deve essere di almeno 1 minuto')
    .max(600, 'Durata troppo lunga')
    .nullable(),
  pesoCorporeoKg: z
    .number({ error: 'Peso corporeo non valido' })
    .min(20, 'Peso corporeo troppo basso')
    .max(400, 'Peso corporeo troppo alto')
    .nullable(),
  esercizi: z
    .array(
      z.object({
        esercizioId: z.string().min(1),
        serie: z.array(serieSchema).max(50, 'Troppe serie per un esercizio'),
      }),
    )
    .max(50),
})

export type SessioneInput = z.infer<typeof sessioneSchema>
export type EsitoValidazione = { ok: true; dati: SessioneInput } | { ok: false; errore: string }

export function validaSessione(input: unknown): EsitoValidazione {
  const parsed = sessioneSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, errore: parsed.error.issues[0]?.message ?? 'Dati non validi' }
  }

  const dati = parsed.data
  const giorno = trovaGiorno(dati.giornoId)
  if (!giorno) return { ok: false, errore: 'Giorno non valido' }

  const ammessi = new Set([...giorno.esercizi, giorno.addome].map((e) => e.id))
  const visti = new Set<string>()
  for (const esercizio of dati.esercizi) {
    if (!ammessi.has(esercizio.esercizioId)) {
      return { ok: false, errore: 'Esercizio non presente in questo giorno' }
    }
    if (visti.has(esercizio.esercizioId)) return { ok: false, errore: 'Esercizio ripetuto' }
    visti.add(esercizio.esercizioId)
  }

  if (dati.esercizi.every((esercizio) => esercizio.serie.length === 0)) {
    return { ok: false, errore: 'Registra almeno una serie' }
  }

  return { ok: true, dati }
}

// Converte il testo del form. La virgola è accettata come separatore decimale.
export function parseNumero(testo: string): number | null {
  const pulito = testo.trim().replace(',', '.')
  if (pulito === '') return null
  const valore = Number(pulito)
  return Number.isFinite(valore) ? valore : null
}

export function parseIntero(testo: string): number | null {
  const valore = parseNumero(testo)
  return valore !== null && Number.isInteger(valore) ? valore : null
}

// Ultimo allenamento dello stesso giorno, usato per precompilare il form.
export type SerieUltima = { pesoKg: number | null; ripetizioni: number }
export type UltimaSessione = {
  pesoCorporeoKg: number | null
  serie: Record<string, SerieUltima[]>
}
