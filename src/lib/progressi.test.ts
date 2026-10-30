import { describe, expect, it } from 'vitest'
import { schedaPredefinita } from '../data/scheda'
import {
  calcolaRecord,
  massimoKg,
  miglioreRM,
  suggerimentoSerie,
  suggerisciCarichi,
  volumeSerie,
} from './progressi'
import type { UltimeVolte } from './tipi'

const giornoA = schedaPredefinita[0]
const panca = giornoA.esercizi[0]

function volta(serie: { pesoKg: number | null; ripetizioni: number }[], datiIniziali = false): UltimeVolte[string] {
  return { data: '2026-10-26T12:00:00.000Z', datiIniziali, serie }
}

describe('volumeSerie', () => {
  it('somma peso × ripetizioni e ignora le serie senza peso', () => {
    expect(
      volumeSerie([
        { pesoKg: 60, ripetizioni: 6 },
        { pesoKg: null, ripetizioni: 12 },
      ]),
    ).toBe(360)
  })
})

describe('massimoKg', () => {
  it('sceglie il peso più alto', () => {
    expect(massimoKg([{ pesoKg: 40, ripetizioni: 6 }, { pesoKg: 50, ripetizioni: 6 }])).toBe(50)
  })

  it('restituisce null se nessuna serie ha un peso', () => {
    expect(massimoKg([{ pesoKg: null, ripetizioni: 12 }])).toBeNull()
    expect(massimoKg([])).toBeNull()
  })
})

describe('miglioreRM', () => {
  it('sceglie la stima più alta tra le serie', () => {
    // 60 × 6 → 72 kg; 70 × 3 → 77 kg
    expect(miglioreRM([{ pesoKg: 60, ripetizioni: 6 }, { pesoKg: 70, ripetizioni: 3 }])).toBeCloseTo(77)
  })

  it('restituisce null se nessuna serie ha un peso', () => {
    expect(miglioreRM([{ pesoKg: null, ripetizioni: 12 }])).toBeNull()
  })
})

describe('suggerisciCarichi', () => {
  it('non suggerisce nulla senza storico', () => {
    expect(suggerisciCarichi(giornoA.esercizi, {})).toEqual({})
  })

  it('propone il carico successivo se tutte le serie hanno raggiunto il massimo', () => {
    const ultime = { [panca.id]: volta(Array.from({ length: 4 }, () => ({ pesoKg: 60, ripetizioni: 6 }))) }
    expect(suggerisciCarichi(giornoA.esercizi, ultime)[panca.id]).toEqual({
      kg: 65,
      aumenta: true,
      ripMax: 6,
      daVerificare: false,
    })
  })

  it('mantiene il carico se una serie è rimasta sotto il massimo', () => {
    const ultime = {
      [panca.id]: volta([
        { pesoKg: 60, ripetizioni: 6 },
        { pesoKg: 60, ripetizioni: 5 },
      ]),
    }
    expect(suggerisciCarichi(giornoA.esercizi, ultime)[panca.id]).toMatchObject({ kg: 60, aumenta: false })
  })

  it('con i dati iniziali non decide: le ripetizioni non sono state registrate davvero', () => {
    // 40 50 50 50 con ripetizioni "8" copiate dal target: sembrerebbe un range completato, ma non lo sappiamo.
    const ultime = {
      [panca.id]: volta(
        [40, 50, 50, 50].map((kg) => ({ pesoKg: kg, ripetizioni: 6 })),
        true,
      ),
    }
    expect(suggerisciCarichi(giornoA.esercizi, ultime)[panca.id]).toEqual({
      kg: 50,
      aumenta: false,
      ripMax: 6,
      daVerificare: true,
    })
  })

  it('non suggerisce carichi per gli esercizi senza "carico a salire"', () => {
    const curl = giornoA.esercizi.find((e) => e.id === 'curl-ez')!
    const ultime = { [curl.id]: volta([{ pesoKg: 20, ripetizioni: 10 }]) }
    expect(suggerisciCarichi(giornoA.esercizi, ultime)[curl.id]).toBeUndefined()
  })

  it('ignora gli esercizi le cui serie non hanno peso', () => {
    const ultime = { [panca.id]: volta([{ pesoKg: null, ripetizioni: 6 }]) }
    expect(suggerisciCarichi(giornoA.esercizi, ultime)).toEqual({})
  })
})

describe('suggerimentoSerie', () => {
  const precedenti = [
    { pesoKg: 40, ripetizioni: 6 },
    { pesoKg: 50, ripetizioni: 6 },
  ]

  it("riprende la stessa serie dell'ultima volta", () => {
    expect(suggerimentoSerie(precedenti, 0, 8, true)).toEqual({ pesoKg: 40, ripetizioni: 6 })
    expect(suggerimentoSerie(precedenti, 1, 8, true)).toEqual({ pesoKg: 50, ripetizioni: 6 })
  })

  it("oltre le serie dell'ultima volta riprende l'ultima serie fatta", () => {
    expect(suggerimentoSerie(precedenti, 3, 8, true)).toEqual({ pesoKg: 50, ripetizioni: 6 })
  })

  it('con ripetizioni non affidabili suggerisce il target della scheda, non il valore copiato', () => {
    expect(suggerimentoSerie(precedenti, 0, 8, false)).toEqual({ pesoKg: 40, ripetizioni: 8 })
  })

  it('senza storico suggerisce solo le ripetizioni del target', () => {
    expect(suggerimentoSerie([], 0, 8, true)).toEqual({ pesoKg: null, ripetizioni: 8 })
    expect(suggerimentoSerie([], 0, null, true)).toEqual({ pesoKg: null, ripetizioni: null })
  })
})

describe('calcolaRecord', () => {
  const giorno = (n: number) => new Date(Date.UTC(2026, 9, n, 12))

  it('tiene il peso più alto per ogni esercizio', () => {
    const record = calcolaRecord([
      { esercizioId: 'panca', nome: 'Panca', pesoKg: 50, data: giorno(1) },
      { esercizioId: 'panca', nome: 'Panca', pesoKg: 52.5, data: giorno(5) },
      { esercizioId: 'squat', nome: 'Squat', pesoKg: 75, data: giorno(3) },
    ])
    expect(record.map((r) => [r.nome, r.pesoKg])).toEqual([
      ['Panca', 52.5],
      ['Squat', 75],
    ])
  })

  it('a parità di peso tiene la data in cui è stato raggiunto per la prima volta', () => {
    const record = calcolaRecord([
      { esercizioId: 'panca', nome: 'Panca', pesoKg: 50, data: giorno(9) },
      { esercizioId: 'panca', nome: 'Panca', pesoKg: 50, data: giorno(2) },
    ])
    expect(record[0].data).toEqual(giorno(2))
  })

  it('ignora le serie senza peso', () => {
    expect(calcolaRecord([{ esercizioId: 'a', nome: 'A', pesoKg: null, data: giorno(1) }])).toEqual([])
  })
})
