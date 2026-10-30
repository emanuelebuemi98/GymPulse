import { describe, expect, it } from 'vitest'
import { asseY, indiceVicino, indiciEtichette, passoTondo, posizione } from './grafico'

describe('passoTondo', () => {
  it('arrotonda al passo tra 1, 2, 5 e 10 per potenza di 10', () => {
    expect(passoTondo(1.6)).toBe(2)
    expect(passoTondo(3)).toBe(5)
    expect(passoTondo(0.12)).toBe(0.2)
  })

  it('usa 1 per valori non positivi', () => {
    expect(passoTondo(0)).toBe(1)
  })
})

describe('asseY', () => {
  it('include tutti i valori con un margine e tick crescenti', () => {
    const asse = asseY([60, 65])
    expect(asse.min).toBeLessThanOrEqual(60)
    expect(asse.max).toBeGreaterThanOrEqual(65)
    expect(asse.tick[0]).toBe(asse.min)
    expect(asse.tick[asse.tick.length - 1]).toBe(asse.max)
    expect([...asse.tick].sort((a, b) => a - b)).toEqual(asse.tick)
    expect(asse.tick.length).toBeGreaterThanOrEqual(3)
    expect(asse.tick.length).toBeLessThanOrEqual(7)
  })

  it('non scende sotto zero', () => {
    expect(asseY([2, 3]).min).toBeGreaterThanOrEqual(0)
  })

  it('gestisce un solo valore o valori tutti uguali a zero', () => {
    const asse = asseY([0, 0])
    expect(asse.min).toBe(0)
    expect(asse.max).toBeGreaterThan(0)
  })

  it('rifiuta un elenco vuoto', () => {
    expect(() => asseY([])).toThrow()
  })
})

describe('posizione', () => {
  it("proietta linearmente e rispetta l'inversione (asse Y)", () => {
    expect(posizione(5, 0, 10, 0, 100)).toBe(50)
    expect(posizione(0, 0, 10, 200, 0)).toBe(200)
  })

  it('centra il punto se il dominio ha una sola posizione', () => {
    expect(posizione(7, 7, 7, 0, 100)).toBe(50)
  })
})

describe('indiceVicino', () => {
  it('trova il punto più vicino alla coordinata', () => {
    expect(indiceVicino(22, [10, 20, 30])).toBe(1)
    expect(indiceVicino(-100, [10, 20, 30])).toBe(0)
    expect(indiceVicino(900, [10, 20, 30])).toBe(2)
  })
})

// Le etichette devono stare dentro i propri margini e non toccarsi.
function nonSiToccano(posizioni: number[], larghezze: number[], scelti: number[], spazio = 8) {
  const scatole = scelti.map((i) => {
    const n = posizioni.length
    const l = larghezze[i]
    if (n === 1) return [posizioni[i] - l / 2, posizioni[i] + l / 2]
    if (i === 0) return [posizioni[i], posizioni[i] + l]
    if (i === n - 1) return [posizioni[i] - l, posizioni[i]]
    return [posizioni[i] - l / 2, posizioni[i] + l / 2]
  })
  return scatole.every((s, k) => k === 0 || s[0] >= scatole[k - 1][1] + spazio)
}

describe('indiciEtichette', () => {
  it('etichetta tutti i punti se ci sta tutto', () => {
    const posizioni = [0, 100, 200, 300]
    expect(indiciEtichette(posizioni, [40, 40, 40, 40])).toEqual([0, 1, 2, 3])
  })

  it('non fa toccare le etichette, anche con date irregolari', () => {
    // Come nella prova reale: distanze molto diverse fra un punto e l'altro.
    const posizioni = [48, 130, 300, 330, 410]
    const larghezze = [70, 70, 70, 70, 70]
    const scelti = indiciEtichette(posizioni, larghezze)
    expect(nonSiToccano(posizioni, larghezze, scelti)).toBe(true)
  })

  it("mantiene sempre l'ultimo punto, cioè la data più recente", () => {
    const posizioni = [48, 60, 72, 84, 400]
    const larghezze = [60, 60, 60, 60, 60]
    const scelti = indiciEtichette(posizioni, larghezze)
    expect(scelti[scelti.length - 1]).toBe(4)
    expect(nonSiToccano(posizioni, larghezze, scelti)).toBe(true)
  })

  it('restituisce un elenco vuoto senza punti', () => {
    expect(indiciEtichette([], [])).toEqual([])
  })
})
