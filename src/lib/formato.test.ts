import { describe, expect, it } from 'vitest'
import { dataIso, formatData, formatDataBreve, formatDataLunga, formatDataNumerica, istanteDaData } from './formato'

const mezzogiorno = (anno: number, mese: number, giorno: number) => new Date(Date.UTC(anno, mese - 1, giorno, 12))

describe('formati di data', () => {
  const data = mezzogiorno(2026, 10, 28)

  it('scrive la data in italiano nei vari formati', () => {
    expect(formatDataLunga(data)).toBe('Mercoledì 28 Ottobre 2026')
    expect(formatDataNumerica(data)).toBe('28/10/2026')
    expect(formatDataBreve(data)).toBe('28/10')
    expect(formatData(data)).toBe('28 ott 2026')
  })

  it('dataIso dà il formato dei campi <input type="date">', () => {
    expect(dataIso(data)).toBe('2026-10-28')
  })

  it('usa il giorno di Roma, non quello UTC', () => {
    // 23:30 a Roma del 28/10 (UTC+1) → 22:30 UTC dello stesso giorno
    expect(dataIso(new Date('2026-10-28T22:30:00.000Z'))).toBe('2026-10-28')
    // 00:30 a Roma del 29/10 → 23:30 UTC del 28
    expect(dataIso(new Date('2026-10-28T23:30:00.000Z'))).toBe('2026-10-29')
  })
})

describe('istanteDaData', () => {
  const ora = new Date('2026-10-28T15:30:00.000Z')

  it("per oggi restituisce l'ora attuale", () => {
    expect(istanteDaData('2026-10-28', ora)).toEqual(ora)
  })

  it('per un giorno passato restituisce il mezzogiorno UTC', () => {
    expect(istanteDaData('2026-10-23', ora)?.toISOString()).toBe('2026-10-23T12:00:00.000Z')
  })

  it('rifiuta il futuro, le date inesistenti e il testo non valido', () => {
    expect(istanteDaData('2026-10-29', ora)).toBeNull()
    expect(istanteDaData('2026-02-30', ora)).toBeNull()
    expect(istanteDaData('2026-2-3', ora)).toBeNull()
    expect(istanteDaData('', ora)).toBeNull()
    expect(istanteDaData('1999-01-01', ora)).toBeNull()
  })
})
