import { describe, expect, it } from 'vitest'
import { parseIntero, parseNumero } from './numeri'
import { validaSessione } from './sessione-schema'

type InputTest = {
  giornoId: string
  data: string
  note: string | null
  durataMinuti: number | null
  pesoCorporeoKg: number | null
  esercizi: {
    esercizioId: string | null
    nomeNuovo: string | null
    serie: { pesoKg: number | null; ripetizioni: number }[]
  }[]
}

// Mercoledì 28 ottobre 2026, ora di Roma
const ORA = new Date('2026-10-28T15:30:00.000Z')

function sessioneBase(): InputTest {
  return {
    giornoId: 'A',
    data: '2026-10-28',
    note: null,
    durataMinuti: 60,
    pesoCorporeoKg: 80,
    esercizi: [
      {
        esercizioId: 'panca-piana',
        nomeNuovo: null,
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
    expect(validaSessione(sessioneBase(), ORA).ok).toBe(true)
  })

  it('accetta un peso vuoto per gli esercizi a corpo libero', () => {
    const input = sessioneBase()
    input.esercizi[0].serie[0] = { pesoKg: null, ripetizioni: 12 }
    expect(validaSessione(input, ORA).ok).toBe(true)
  })

  it('accetta un esercizio nuovo, indicato per nome', () => {
    const input = sessioneBase()
    input.esercizi.push({ esercizioId: null, nomeNuovo: 'Hip thrust', serie: [{ pesoKg: 60, ripetizioni: 10 }] })
    expect(validaSessione(input, ORA).ok).toBe(true)
  })

  it('rifiuta un esercizio senza id e senza nome, o con entrambi', () => {
    const senza = sessioneBase()
    senza.esercizi[0].esercizioId = null
    expect(validaSessione(senza, ORA)).toEqual({ ok: false, errore: 'Esercizio non valido' })

    const entrambi = sessioneBase()
    entrambi.esercizi[0].nomeNuovo = 'Altro'
    expect(validaSessione(entrambi, ORA)).toEqual({ ok: false, errore: 'Esercizio non valido' })
  })

  it('rifiuta un esercizio ripetuto, anche con maiuscole diverse tra i nuovi', () => {
    const doppio = sessioneBase()
    doppio.esercizi.push({ ...doppio.esercizi[0] })
    expect(validaSessione(doppio, ORA)).toEqual({ ok: false, errore: 'Esercizio ripetuto' })

    const nuovi = sessioneBase()
    nuovi.esercizi.push(
      { esercizioId: null, nomeNuovo: 'Hip thrust', serie: [{ pesoKg: 60, ripetizioni: 10 }] },
      { esercizioId: null, nomeNuovo: 'HIP THRUST', serie: [{ pesoKg: 60, ripetizioni: 10 }] },
    )
    expect(validaSessione(nuovi, ORA)).toEqual({ ok: false, errore: 'Esercizio ripetuto' })
  })

  it('rifiuta una sessione senza serie confermate', () => {
    const input = sessioneBase()
    input.esercizi[0].serie = []
    expect(validaSessione(input, ORA)).toEqual({ ok: false, errore: 'Conferma almeno una serie' })
  })

  it('rifiuta un peso negativo', () => {
    const input = sessioneBase()
    input.esercizi[0].serie[0].pesoKg = -5
    expect(validaSessione(input, ORA)).toEqual({ ok: false, errore: 'Il peso non può essere negativo' })
  })

  it('rifiuta zero ripetizioni e ripetizioni non intere', () => {
    const zero = sessioneBase()
    zero.esercizi[0].serie[0].ripetizioni = 0
    expect(validaSessione(zero, ORA)).toEqual({ ok: false, errore: 'Almeno una ripetizione' })

    const decimali = sessioneBase()
    decimali.esercizi[0].serie[0].ripetizioni = 6.5
    expect(validaSessione(decimali, ORA)).toEqual({
      ok: false,
      errore: 'Le ripetizioni devono essere un numero intero',
    })
  })

  it('rifiuta note troppo lunghe', () => {
    const input = sessioneBase()
    input.note = 'x'.repeat(501)
    expect(validaSessione(input, ORA)).toEqual({ ok: false, errore: 'Le note sono troppo lunghe' })
  })
})

describe('validaSessione: la data', () => {
  it("per oggi usa l'ora attuale, così due sedute dello stesso giorno restano in ordine", () => {
    const esito = validaSessione(sessioneBase(), ORA)
    expect(esito.ok && esito.istante).toEqual(ORA)
  })

  it('per un giorno passato usa il mezzogiorno UTC', () => {
    const input = sessioneBase()
    input.data = '2026-10-23'
    const esito = validaSessione(input, ORA)
    expect(esito.ok && esito.istante.toISOString()).toBe('2026-10-23T12:00:00.000Z')
  })

  it('rifiuta una data nel futuro', () => {
    const input = sessioneBase()
    input.data = '2026-10-29'
    expect(validaSessione(input, ORA)).toEqual({ ok: false, errore: 'La data non è valida o è nel futuro' })
  })

  it('rifiuta una data che non esiste o scritta male', () => {
    for (const data of ['2026-02-30', '2026-13-01', '28/10/2026', '', 'ieri']) {
      const input = sessioneBase()
      input.data = data
      expect(validaSessione(input, ORA)).toEqual({ ok: false, errore: 'La data non è valida o è nel futuro' })
    }
  })

  it('di sera tardi a Roma conta ancora come oggi, anche se in UTC è già un altro giorno', () => {
    // 23:30 a Roma (UTC+1) del 28/10 → 22:30 UTC
    const tardi = new Date('2026-10-28T22:30:00.000Z')
    const input = sessioneBase()
    input.data = '2026-10-28'
    expect(validaSessione(input, tardi).ok).toBe(true)
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
