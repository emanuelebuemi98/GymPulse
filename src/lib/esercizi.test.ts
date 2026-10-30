import { describe, expect, it } from 'vitest'
import { creaIdEsercizio } from './esercizi'

describe('creaIdEsercizio', () => {
  const fisso = () => 'abc123'

  it('semplifica il nome: minuscole, senza accenti né simboli', () => {
    expect(creaIdEsercizio('Hip Thrust', fisso)).toBe('x-hip-thrust-abc123')
    expect(creaIdEsercizio('Rematore à 90°', fisso)).toBe('x-rematore-a-90-abc123')
  })

  it('ha sempre il prefisso x-, così non collide con gli id della scheda predefinita', () => {
    expect(creaIdEsercizio('Panca piana', fisso).startsWith('x-')).toBe(true)
    expect(creaIdEsercizio('Panca piana', fisso)).not.toBe('panca-piana')
  })

  it('con un nome senza lettere usa "esercizio"', () => {
    expect(creaIdEsercizio('???', fisso)).toBe('x-esercizio-abc123')
  })

  it('accorcia i nomi molto lunghi senza lasciare un trattino finale', () => {
    // Il taglio a 30 caratteri cade proprio sul trattino dopo le 29 "a": va tolto.
    const id = creaIdEsercizio('a'.repeat(29) + ' bbbbbbbbbbbbbbbb', fisso)
    expect(id).toBe(`x-${'a'.repeat(29)}-abc123`)
  })

  it('accorcia i nomi lunghi tenendo l\'inizio del nome', () => {
    const id = creaIdEsercizio('a'.repeat(28) + ' bbbbbbbbbbbbbbbb', fisso)
    expect(id).toBe(`x-${'a'.repeat(28)}-b-abc123`)
  })

  it('due esercizi con lo stesso nome ottengono id diversi', () => {
    expect(creaIdEsercizio('Hip thrust')).not.toBe(creaIdEsercizio('Hip thrust'))
  })
})
