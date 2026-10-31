import { z } from 'zod'

// Backup completo in JSON: scheda, esercizi e tutte le sedute. Serve a spostare i dati tra dispositivi
// e a non perderli. Le date sono testo ISO, così il file si legge e si controlla a mano.

const intero = z.number().int().nullable()

const esercizioSchema = z.object({
  id: z.number().int().positive().max(2_147_483_647),
  nome: z.string().min(1).max(100),
  muscoli: z.string().max(200),
})

const voceSchema = z.object({
  esercizioId: z.number().int().positive().max(2_147_483_647),
  ordine: z.number().int().min(1),
  tipo: z.enum(['serie', 'totale', 'libero']),
  serie: intero,
  ripMin: intero,
  ripMax: intero,
  recuperoSec: intero,
  ripTotali: intero,
  serieMin: intero,
  serieMax: intero,
  nota: z.string().max(200).nullable(),
  incrementoKg: z.number().min(0).max(100).nullable(),
})

const giornoSchema = z.object({
  id: z.string().min(1).max(20),
  titolo: z.string().min(1).max(100),
  voci: z.array(voceSchema).max(60),
})

const serieSchema = z.object({
  esercizioId: z.number().int().positive().max(2_147_483_647),
  ordine: z.number().int().min(1),
  pesoKg: z.number().min(0).max(1000).nullable(),
  ripetizioni: z.number().int().min(1).max(10000),
})

const sessioneSchema = z.object({
  id: z.number().int().positive().max(2_147_483_647),
  giornoId: z.string().min(1),
  data: z.iso.datetime(),
  note: z.string().max(1000).nullable(),
  durataMinuti: intero,
  datiIniziali: z.boolean(),
  serie: z.array(serieSchema).max(1000),
})

const backupSchema = z.object({
  formato: z.literal('gympulse-backup'),
  versione: z.literal(4),
  esportatoIl: z.iso.datetime(),
  esercizi: z.array(esercizioSchema).max(2000),
  scheda: z.array(giornoSchema).min(1).max(20),
  sessioni: z.array(sessioneSchema).max(10000),
})

export type Backup = z.infer<typeof backupSchema>

type VoceDb = {
  esercizioId: number
  ordine: number
  tipo: string
  serie: number | null
  ripMin: number | null
  ripMax: number | null
  recuperoSec: number | null
  ripTotali: number | null
  serieMin: number | null
  serieMax: number | null
  nota: string | null
  incrementoKg: number | null
}

export type DatiBackup = {
  esercizi: { id: number; nome: string; muscoli: string }[]
  giorni: { id: string; titolo: string; voci: VoceDb[] }[]
  sessioni: {
    id: number
    giornoId: string
    data: Date
    note: string | null
    durataMinuti: number | null
    datiIniziali: boolean
    serie: { esercizioId: number; ordine: number; pesoKg: number | null; ripetizioni: number }[]
  }[]
}

export function creaBackup(dati: DatiBackup, ora = new Date()): Backup {
  return {
    formato: 'gympulse-backup',
    versione: 4,
    esportatoIl: ora.toISOString(),
    esercizi: dati.esercizi.map((e) => ({ id: e.id, nome: e.nome, muscoli: e.muscoli })),
    scheda: dati.giorni.map((giorno) => ({
      id: giorno.id,
      titolo: giorno.titolo,
      voci: giorno.voci.map((voce) => ({
        esercizioId: voce.esercizioId,
        ordine: voce.ordine,
        tipo: voce.tipo as 'serie' | 'totale' | 'libero',
        serie: voce.serie,
        ripMin: voce.ripMin,
        ripMax: voce.ripMax,
        recuperoSec: voce.recuperoSec,
        ripTotali: voce.ripTotali,
        serieMin: voce.serieMin,
        serieMax: voce.serieMax,
        nota: voce.nota,
        incrementoKg: voce.incrementoKg,
      })),
    })),
    sessioni: dati.sessioni.map((sessione) => ({
      id: sessione.id,
      giornoId: sessione.giornoId,
      data: sessione.data.toISOString(),
      note: sessione.note,
      durataMinuti: sessione.durataMinuti,
      datiIniziali: sessione.datiIniziali,
      serie: sessione.serie.map((serie) => ({
        esercizioId: serie.esercizioId,
        ordine: serie.ordine,
        pesoKg: serie.pesoKg,
        ripetizioni: serie.ripetizioni,
      })),
    })),
  }
}

export type EsitoBackup = { ok: true; backup: Backup } | { ok: false; errore: string }

// Legge un file di backup e ne controlla anche i riferimenti: ogni voce, serie e sessione deve puntare a qualcosa che esiste.
export function leggiBackup(testo: string): EsitoBackup {
  let json: unknown
  try {
    json = JSON.parse(testo)
  } catch {
    return { ok: false, errore: 'Il file non è un JSON valido' }
  }

  const parsed = backupSchema.safeParse(json)
  if (!parsed.success) return { ok: false, errore: 'Il file non è un backup di GymPulse' }
  const backup = parsed.data

  const esercizi = new Set(backup.esercizi.map((e) => e.id))
  const giorni = new Set(backup.scheda.map((g) => g.id))
  if (esercizi.size !== backup.esercizi.length) return { ok: false, errore: 'Il backup ha esercizi duplicati' }
  if (giorni.size !== backup.scheda.length) return { ok: false, errore: 'Il backup ha giornate duplicate' }
  if (new Set(backup.sessioni.map((s) => s.id)).size !== backup.sessioni.length) {
    return { ok: false, errore: 'Il backup ha sedute duplicate' }
  }

  for (const giorno of backup.scheda) {
    if (giorno.voci.some((voce) => !esercizi.has(voce.esercizioId))) {
      return { ok: false, errore: 'La scheda usa un esercizio che non è nel backup' }
    }
  }
  for (const sessione of backup.sessioni) {
    if (!giorni.has(sessione.giornoId)) return { ok: false, errore: 'Una seduta usa una giornata che non è nel backup' }
    if (sessione.serie.some((serie) => !esercizi.has(serie.esercizioId))) {
      return { ok: false, errore: 'Una seduta usa un esercizio che non è nel backup' }
    }
  }

  return { ok: true, backup }
}
