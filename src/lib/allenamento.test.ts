import { describe, expect, it } from 'vitest'
import { schedaPredefinita } from '../data/scheda'
import {
  descrizioneObiettivo,
  formatRecupero,
  formatTimer,
  giornoConsigliato,
  indiceGiornoSuccessivo,
  prossimoCarico,
  ripetizioniTarget,
  serieIniziali,
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

describe('formatTimer', () => {
  it('mostra minuti e secondi come un timer', () => {
    expect(formatTimer(90)).toBe('1:30')
    expect(formatTimer(120)).toBe('2:00')
    expect(formatTimer(5)).toBe('0:05')
    expect(formatTimer(0)).toBe('0:00')
  })
})

describe('giornoConsigliato', () => {
  const giorni3 = [{ id: 'A' }, { id: 'B' }, { id: 'C' }]

  it('parte dalla prima giornata senza storico', () => {
    expect(giornoConsigliato(giorni3, null).id).toBe('A')
  })

  it("propone la giornata dopo l'ultima, in ciclo", () => {
    expect(giornoConsigliato(giorni3, 'A').id).toBe('B')
    expect(giornoConsigliato(giorni3, 'C').id).toBe('A')
  })

  it("riparte dalla prima se l'ultima giornata non esiste più", () => {
    expect(giornoConsigliato(giorni3, 'Z').id).toBe('A')
  })
})

describe('serieIniziali e ripetizioniTarget', () => {
  it('usa il numero di serie della scheda', () => {
    expect(serieIniziali({ tipo: 'serie', serie: 4, ripMin: 6, ripMax: 6, recuperoSec: 120 })).toBe(4)
    expect(serieIniziali({ tipo: 'libero', serieMin: 3, serieMax: 4 })).toBe(3)
    expect(serieIniziali({ tipo: 'totale', ripTotali: 50 })).toBe(3)
  })

  it('punta al massimo del range, o a niente se l\'obiettivo non lo fissa', () => {
    expect(ripetizioniTarget({ tipo: 'serie', serie: 3, ripMin: 6, ripMax: 8, recuperoSec: 120 })).toBe(8)
    expect(ripetizioniTarget({ tipo: 'totale', ripTotali: 50 })).toBeNull()
  })
})

describe('scheda predefinita', () => {
  const esercizi = schedaPredefinita.flatMap((g) => g.esercizi)

  it('ha le giornate A, B e C', () => {
    expect(schedaPredefinita.map((g) => g.id)).toEqual(['A', 'B', 'C'])
  })

  it('contiene 22 esercizi: i 19 del PDF, il curl con manubri e i 3 addominali', () => {
    expect(esercizi).toHaveLength(23)
  })

  it('usa un id unico per ogni esercizio', () => {
    const ids = esercizi.map((e) => e.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})
