import { describe, expect, it } from 'vitest'
import { giorni } from '../data/scheda'
import {
  descrizioneObiettivo,
  formatRecupero,
  indiceGiornoSuccessivo,
  prossimoCarico,
  stimaKcal,
  stimaRM,
} from './allenamento'

describe('indiceGiornoSuccessivo', () => {
  it('parte dal primo giorno senza storico', () => {
    expect(indiceGiornoSuccessivo(null, 3)).toBe(0)
  })

  it("segue l'ordine 1 → 2 → 3 → 1", () => {
    expect(indiceGiornoSuccessivo(0, 3)).toBe(1)
    expect(indiceGiornoSuccessivo(1, 3)).toBe(2)
    expect(indiceGiornoSuccessivo(2, 3)).toBe(0)
  })

  it('rifiuta una scheda vuota', () => {
    expect(() => indiceGiornoSuccessivo(null, 0)).toThrow()
  })
})

describe('prossimoCarico', () => {
  it('non suggerisce nulla senza storico', () => {
    expect(prossimoCarico([], 6, 5)).toBeNull()
  })

  it('aggiunge l\'incremento se tutte le serie hanno raggiunto il massimo', () => {
    const serie = [
      { peso: 60, ripetizioni: 6 },
      { peso: 60, ripetizioni: 6 },
    ]
    expect(prossimoCarico(serie, 6, 5)).toBe(65)
  })

  it('mantiene il carico se una serie è rimasta sotto il massimo', () => {
    const serie = [
      { peso: 60, ripetizioni: 6 },
      { peso: 60, ripetizioni: 5 },
    ]
    expect(prossimoCarico(serie, 6, 5)).toBe(60)
  })
})

describe('stimaRM', () => {
  it('applica la formula di Epley', () => {
    expect(stimaRM(100, 10)).toBeCloseTo(133.33, 2)
  })

  it('rifiuta zero ripetizioni', () => {
    expect(() => stimaRM(100, 0)).toThrow()
  })
})

describe('stimaKcal', () => {
  it('usa MET × peso × ore', () => {
    expect(stimaKcal(80, 60)).toBe(400)
    expect(stimaKcal(80, 90)).toBe(600)
  })
})

describe('descrizioneObiettivo', () => {
  it('mostra serie e ripetizioni, con o senza range', () => {
    expect(descrizioneObiettivo({ tipo: 'serie', serie: 4, ripMin: 6, ripMax: 6, recuperoSec: 120 })).toBe('4 × 6')
    expect(descrizioneObiettivo({ tipo: 'serie', serie: 3, ripMin: 6, ripMax: 8, recuperoSec: 120 })).toBe('3 × 6-8')
  })

  it('descrive gli obiettivi a totale e a serie libere', () => {
    expect(descrizioneObiettivo({ tipo: 'totale', ripTotali: 50 })).toBe('50 ripetizioni totali')
    expect(descrizioneObiettivo({ tipo: 'libero', serieMin: 3, serieMax: 4 })).toBe('3-4 serie')
  })
})

describe('formatRecupero', () => {
  it('formatta i secondi come nella scheda', () => {
    expect(formatRecupero(120)).toBe('2 min')
    expect(formatRecupero(90)).toBe('1 min 30 s')
    expect(formatRecupero(60)).toBe('1 min')
    expect(formatRecupero(45)).toBe('45 s')
  })
})

describe('dati della scheda', () => {
  it('contiene 3 giorni e 19 esercizi principali, come nel PDF', () => {
    expect(giorni).toHaveLength(3)
    expect(giorni.reduce((tot, g) => tot + g.esercizi.length, 0)).toBe(19)
  })

  it('usa un id unico per ogni esercizio', () => {
    const ids = giorni.flatMap((g) => [...g.esercizi, g.addome]).map((e) => e.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})
