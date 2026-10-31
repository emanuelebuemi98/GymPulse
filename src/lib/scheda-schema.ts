import { z } from 'zod'
import type { Obiettivo } from './scheda-tipi'
import { RECUPERO_PREDEFINITO } from './voci'

// Regole per la modifica di una giornata della scheda. Il server ricontrolla tutto.

const intero = (min: number, max: number, messaggio: string) =>
  z.number({ error: messaggio }).int(messaggio).min(min, messaggio).max(max, messaggio).nullable()

const voceSchema = z
  .object({
    esercizioId: z.number().int().positive().max(2_147_483_647).nullable(),
    nomeNuovo: z.string().trim().min(1, 'Nome esercizio mancante').max(60, 'Nome esercizio troppo lungo').nullable(),
    tipo: z.enum(['serie', 'totale', 'libero']),
    serie: intero(1, 20, 'Le serie devono essere da 1 a 20'),
    ripMin: intero(1, 100, 'Le ripetizioni devono essere da 1 a 100'),
    ripMax: intero(1, 100, 'Le ripetizioni devono essere da 1 a 100'),
    recuperoSec: intero(0, 900, 'Il recupero deve essere da 0 a 900 secondi'),
    ripTotali: intero(1, 1000, 'Le ripetizioni totali devono essere da 1 a 1000'),
    serieMin: intero(1, 20, 'Le serie devono essere da 1 a 20'),
    serieMax: intero(1, 20, 'Le serie devono essere da 1 a 20'),
    nota: z.string().trim().max(120, 'La nota è troppo lunga').nullable(),
    incrementoKg: z
      .number({ error: "L'incremento non è valido" })
      .min(0, "L'incremento non può essere negativo")
      .max(50, "L'incremento è troppo alto")
      .nullable(),
  })
  .refine((v) => (v.esercizioId === null) !== (v.nomeNuovo === null), { message: 'Esercizio non valido' })

const schedaSchema = z.object({
  giornoId: z.string().min(1, 'Giorno mancante'),
  titolo: z.string().trim().min(1, 'Scrivi un titolo').max(60, 'Il titolo è troppo lungo'),
  voci: z.array(voceSchema).min(1, 'Aggiungi almeno un esercizio').max(30, 'Troppi esercizi'),
})

export type VoceNormalizzata = {
  esercizioId: number | null
  nomeNuovo: string | null
  obiettivo: Obiettivo
  nota: string | null
  incrementoKg: number | null
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
  const nomi = new Set<string>()
  const normalizzate: VoceNormalizzata[] = []

  for (const voce of voci) {
    const nome = voce.nomeNuovo ?? ''
    if (voce.esercizioId !== null) {
      if (ids.has(voce.esercizioId)) return { ok: false, errore: 'Esercizio ripetuto' }
      ids.add(voce.esercizioId)
    } else {
      if (nomi.has(nome.toLowerCase())) return { ok: false, errore: 'Esercizio ripetuto' }
      nomi.add(nome.toLowerCase())
    }

    let obiettivo: Obiettivo
    if (voce.tipo === 'serie') {
      if (voce.serie === null || voce.ripMin === null) {
        return { ok: false, errore: 'Indica serie e ripetizioni di ogni esercizio' }
      }
      const ripMax = voce.ripMax ?? voce.ripMin
      if (ripMax < voce.ripMin) return { ok: false, errore: 'Il massimo delle ripetizioni non può essere sotto il minimo' }
      obiettivo = {
        tipo: 'serie',
        serie: voce.serie,
        ripMin: voce.ripMin,
        ripMax,
        recuperoSec: voce.recuperoSec ?? RECUPERO_PREDEFINITO,
      }
    } else if (voce.tipo === 'totale') {
      if (voce.ripTotali === null) return { ok: false, errore: 'Indica le ripetizioni totali' }
      obiettivo = { tipo: 'totale', ripTotali: voce.ripTotali }
    } else {
      if (voce.serieMin === null) return { ok: false, errore: 'Indica quante serie fare' }
      const serieMax = voce.serieMax ?? voce.serieMin
      if (serieMax < voce.serieMin) return { ok: false, errore: 'Il massimo delle serie non può essere sotto il minimo' }
      obiettivo = { tipo: 'libero', serieMin: voce.serieMin, serieMax }
    }

    normalizzate.push({
      esercizioId: voce.esercizioId,
      nomeNuovo: voce.nomeNuovo,
      obiettivo,
      nota: voce.nota ? voce.nota : null,
      incrementoKg: voce.incrementoKg ? voce.incrementoKg : null,
    })
  }

  return { ok: true, dati: { giornoId, titolo, voci: normalizzate } }
}
