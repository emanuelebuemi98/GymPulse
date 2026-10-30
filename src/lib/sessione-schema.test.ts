import { describe, expect, it } from 'vitest'
import { parseIntero, parseNumero, validaSessione } from './sessione-schema'

type InputTest = {
  giornoId: string
  durataMinuti: number | null
  pesoCorporeoKg: number | null
  esercizi: { esercizioId: string; serie: { pesoKg: number | null; ripetizioni: number }[] }[]
}

function sessioneBase(): InputTest {
  return {
    giornoId: 'giorno-1',
    durataMinuti: 60,
    pesoCorporeoKg: 80,
    esercizi: [
      {
        esercizioId: 'panca-piana',
        serie: [
          { pesoKg: 60, ripetizioni: 6 },
          { pesoKg: 60, ripetizioni: 5 },
        ],
      },
    ],
  }
}

describe('validaSessione', () => {
  it('accetta una sessione corretta', () => {
    const esito = validaSessione(sessioneBase())
    expect(esito.ok).toBe(true)
  })

  it('accetta un peso vuoto per gli esercizi a corpo libero', () => {
    const input = sessioneBase()
    input.esercizi[0].serie[0] = { pesoKg: null, ripetizioni: 12 }
    expect(validaSessione(input).ok).toBe(true)
  })

  it('rifiuta un giorno inesistente', () => {
    const input = { ...sessioneBase(), giornoId: 'giorno-9' }
    expect(validaSessione(input)).toEqual({ ok: false, errore: 'Giorno non valido' })
  })

  it('rifiuta un esercizio che non appartiene al giorno', () => {
    const input = sessioneBase()
    input.esercizi[0].esercizioId = 'stacco-terra'
    expect(validaSessione(input)).toEqual({
      ok: false,
      errore: 'Esercizio non presente in questo giorno',
    })
  })

  it('rifiuta un esercizio ripetuto', () => {
    const input = sessioneBase()
    input.esercizi.push({ ...input.esercizi[0] })
    expect(validaSessione(input)).toEqual({ ok: false, errore: 'Esercizio ripetuto' })
  })

  it('rifiuta una sessione senza serie', () => {
    const input = sessioneBase()
    input.esercizi[0].serie = []
    expect(validaSessione(input)).toEqual({ ok: false, errore: 'Registra almeno una serie' })
  })

  it('rifiuta un peso negativo', () => {
    const input = sessioneBase()
    input.esercizi[0].serie[0].pesoKg = -5
    expect(validaSessione(input)).toEqual({
      ok: false,
      errore: 'Il peso non può essere negativo',
    })
  })

  it('rifiuta zero ripetizioni', () => {
    const input = sessioneBase()
    input.esercizi[0].serie[0].ripetizioni = 0
    expect(validaSessione(input)).toEqual({ ok: false, errore: 'Almeno una ripetizione' })
  })

  it('rifiuta ripetizioni non intere', () => {
    const input = sessioneBase()
    input.esercizi[0].serie[0].ripetizioni = 6.5
    expect(validaSessione(input)).toEqual({
      ok: false,
      errore: 'Le ripetizioni devono essere un numero intero',
    })
  })

  it('rifiuta ripetizioni mancanti (null dal form)', () => {
    const input = sessioneBase()
    input.esercizi[0].serie[0].ripetizioni = null as unknown as number
    expect(validaSessione(input)).toEqual({ ok: false, errore: 'Ripetizioni non valide' })
  })
})

describe('parseNumero', () => {
  it('accetta il punto e la virgola come separatore decimale', () => {
    expect(parseNumero('62.5')).toBe(62.5)
    expect(parseNumero('62,5')).toBe(62.5)
  })

  it('ignora gli spazi intorno al valore', () => {
    expect(parseNumero(' 60 ')).toBe(60)
  })

  it('restituisce null per testo vuoto o non numerico', () => {
    expect(parseNumero('')).toBeNull()
    expect(parseNumero('   ')).toBeNull()
    expect(parseNumero('abc')).toBeNull()
  })
})

describe('parseIntero', () => {
  it('accetta solo numeri interi', () => {
    expect(parseIntero('6')).toBe(6)
    expect(parseIntero('6.5')).toBeNull()
  })
})
