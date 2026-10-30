import { describe, expect, it } from 'vitest'
import { codiceInvitoCorretto, giornateVuote, valutaCodiceInvito, validaRegistrazione, èViolazioneUnicita } from './registrazione'

describe('valutaCodiceInvito', () => {
  it('accetta un codice abbastanza lungo e ne toglie gli spazi ai lati', () => {
    expect(valutaCodiceInvito('palestra-2026')).toEqual({ ok: true, codice: 'palestra-2026' })
    expect(valutaCodiceInvito('  palestra-2026  ')).toEqual({ ok: true, codice: 'palestra-2026' })
  })

  it('con il codice mancante, vuoto o corto le registrazioni sono chiuse', () => {
    expect(valutaCodiceInvito(undefined)).toEqual({ ok: false })
    expect(valutaCodiceInvito('')).toEqual({ ok: false })
    expect(valutaCodiceInvito('   ')).toEqual({ ok: false })
    expect(valutaCodiceInvito('corto')).toEqual({ ok: false })
    expect(valutaCodiceInvito('1234567')).toEqual({ ok: false })
    expect(valutaCodiceInvito('12345678').ok).toBe(true)
  })
})

describe('codiceInvitoCorretto', () => {
  it('accetta il codice giusto, anche con spazi ai lati', () => {
    expect(codiceInvitoCorretto('palestra-2026', 'palestra-2026')).toBe(true)
    expect(codiceInvitoCorretto('  palestra-2026 ', 'palestra-2026')).toBe(true)
  })

  it('rifiuta codici sbagliati, quasi giusti, vuoti o di altro tipo', () => {
    expect(codiceInvitoCorretto('Palestra-2026', 'palestra-2026')).toBe(false)
    expect(codiceInvitoCorretto('palestra-202', 'palestra-2026')).toBe(false)
    expect(codiceInvitoCorretto('palestra-20266', 'palestra-2026')).toBe(false)
    expect(codiceInvitoCorretto('', 'palestra-2026')).toBe(false)
    expect(codiceInvitoCorretto(undefined, 'palestra-2026')).toBe(false)
    expect(codiceInvitoCorretto(null, 'palestra-2026')).toBe(false)
    expect(codiceInvitoCorretto(12345678, 'palestra-2026')).toBe(false)
    expect(codiceInvitoCorretto('x'.repeat(500), 'palestra-2026')).toBe(false)
  })
})

describe('validaRegistrazione', () => {
  it('accetta nome utente, password e conferma corretti', () => {
    expect(validaRegistrazione('luca', 'una-password-lunga', 'una-password-lunga')).toBeNull()
  })

  it('rifiuta una conferma diversa dalla password', () => {
    expect(validaRegistrazione('luca', 'una-password-lunga', 'una-password-lungA')).toBe('Le due password non coincidono')
    expect(validaRegistrazione('luca', 'una-password-lunga', '')).toBe('Le due password non coincidono')
  })

  it('applica le regole sulle credenziali prima di guardare la conferma', () => {
    expect(validaRegistrazione('Luca', 'una-password-lunga', 'una-password-lunga')).not.toBeNull()
    expect(validaRegistrazione('luca', 'corta', 'corta')).toContain('almeno 10')
  })
})

describe('giornateVuote', () => {
  it('crea le tre giornate A, B e C in ordine, senza esercizi né focus', () => {
    expect(giornateVuote()).toEqual([
      { id: 'A', numero: 1, titolo: 'Giornata A', focus: '' },
      { id: 'B', numero: 2, titolo: 'Giornata B', focus: '' },
      { id: 'C', numero: 3, titolo: 'Giornata C', focus: '' },
    ])
  })
})

describe('èViolazioneUnicita', () => {
  it('riconosce solo il codice P2002 di Prisma', () => {
    expect(èViolazioneUnicita({ code: 'P2002' })).toBe(true)
    expect(èViolazioneUnicita({ code: 'P2025' })).toBe(false)
    expect(èViolazioneUnicita(new Error('x'))).toBe(false)
    expect(èViolazioneUnicita(null)).toBe(false)
    expect(èViolazioneUnicita('P2002')).toBe(false)
  })
})
