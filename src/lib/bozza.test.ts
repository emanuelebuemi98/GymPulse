import { beforeEach, describe, expect, it, vi } from 'vitest'
import { eliminaBozza, leggiBozza, salvaBozza } from './bozza'

// Un localStorage finto: i test girano in Node, dove non esiste.
function creaStorageFinto() {
  const dati = new Map<string, string>()
  return {
    getItem: (chiave: string) => dati.get(chiave) ?? null,
    setItem: (chiave: string, valore: string) => void dati.set(chiave, valore),
    removeItem: (chiave: string) => void dati.delete(chiave),
  }
}

describe('bozza della sessione', () => {
  let storage: ReturnType<typeof creaStorageFinto>

  beforeEach(() => {
    storage = creaStorageFinto()
    vi.stubGlobal('localStorage', storage)
  })

  it('una bozza salvata si rilegge', () => {
    salvaBozza('A', { note: 'riscaldamento', serie: [1, 2] })
    expect(leggiBozza('A')).toEqual({ note: 'riscaldamento', serie: [1, 2] })
  })

  it('le bozze di giornate diverse non si mescolano', () => {
    salvaBozza('A', { x: 1 })
    expect(leggiBozza('B')).toBeNull()
  })

  it('una bozza vecchia di oltre 12 ore viene scartata e rimossa', () => {
    salvaBozza('A', { x: 1 })
    const trediciOre = Date.now() + 13 * 60 * 60 * 1000
    expect(leggiBozza('A', trediciOre)).toBeNull()
    expect(storage.getItem('gympulse-bozza-A')).toBeNull()
  })

  it('una bozza di poco fa è ancora valida', () => {
    salvaBozza('A', { x: 1 })
    expect(leggiBozza('A', Date.now() + 60 * 60 * 1000)).toEqual({ x: 1 })
  })

  it('eliminaBozza la cancella', () => {
    salvaBozza('A', { x: 1 })
    eliminaBozza('A')
    expect(leggiBozza('A')).toBeNull()
  })

  it('un contenuto rovinato non fa errore: viene ignorato', () => {
    storage.setItem('gympulse-bozza-A', '{non json')
    expect(leggiBozza('A')).toBeNull()
    storage.setItem('gympulse-bozza-A', '"stringa"')
    expect(leggiBozza('A')).toBeNull()
    storage.setItem('gympulse-bozza-A', JSON.stringify({ dati: { x: 1 } }))
    expect(leggiBozza('A')).toBeNull()
  })

  it('se lo storage non è disponibile non fa errore', () => {
    vi.stubGlobal('localStorage', {
      getItem: () => {
        throw new Error('bloccato')
      },
      setItem: () => {
        throw new Error('pieno')
      },
      removeItem: () => {
        throw new Error('bloccato')
      },
    })
    expect(() => salvaBozza('A', { x: 1 })).not.toThrow()
    expect(leggiBozza('A')).toBeNull()
    expect(() => eliminaBozza('A')).not.toThrow()
  })
})
