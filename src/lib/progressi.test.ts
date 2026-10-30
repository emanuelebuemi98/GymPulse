import { describe, expect, it } from 'vitest'
import { giorni } from '../data/scheda'
import { miglioreRM, suggerisciCarichi, trovaEsercizio, volumeSerie } from './progressi'
import type { UltimaSessione } from './sessione-schema'

const giornoUno = giorni[0]

function ultimaCon(serie: UltimaSessione['serie']): UltimaSessione {
  return { pesoCorporeoKg: 80, serie }
}

describe('volumeSerie', () => {
  it('somma peso × ripetizioni e ignora le serie senza peso', () => {
    const volume = volumeSerie([
      { pesoKg: 60, ripetizioni: 6 },
      { pesoKg: null, ripetizioni: 12 },
    ])
    expect(volume).toBe(360)
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
  const panca = giornoUno.esercizi[0]

  it('non suggerisce nulla senza storico', () => {
    expect(suggerisciCarichi(giornoUno.esercizi, null)).toEqual({})
  })

  it('propone il carico successivo se tutte le serie hanno raggiunto il massimo', () => {
    const ultima = ultimaCon({
      [panca.id]: [
        { pesoKg: 60, ripetizioni: 6 },
        { pesoKg: 60, ripetizioni: 6 },
        { pesoKg: 60, ripetizioni: 6 },
        { pesoKg: 60, ripetizioni: 6 },
      ],
    })
    expect(suggerisciCarichi(giornoUno.esercizi, ultima)[panca.id]).toEqual({
      kg: 65,
      aumenta: true,
      ripMax: 6,
    })
  })

  it('mantiene il carico se una serie è rimasta sotto il massimo', () => {
    const ultima = ultimaCon({
      [panca.id]: [
        { pesoKg: 60, ripetizioni: 6 },
        { pesoKg: 60, ripetizioni: 6 },
        { pesoKg: 60, ripetizioni: 6 },
        { pesoKg: 60, ripetizioni: 5 },
      ],
    })
    expect(suggerisciCarichi(giornoUno.esercizi, ultima)[panca.id]).toEqual({
      kg: 60,
      aumenta: false,
      ripMax: 6,
    })
  })

  it('non suggerisce carichi per gli esercizi senza "carico a salire"', () => {
    const curl = giornoUno.esercizi.find((e) => e.id === 'curl-ez')!
    const ultima = ultimaCon({ [curl.id]: [{ pesoKg: 20, ripetizioni: 10 }] })
    expect(suggerisciCarichi(giornoUno.esercizi, ultima)[curl.id]).toBeUndefined()
  })

  it('ignora le serie senza peso', () => {
    const ultima = ultimaCon({ [panca.id]: [{ pesoKg: null, ripetizioni: 6 }] })
    expect(suggerisciCarichi(giornoUno.esercizi, ultima)).toEqual({})
  })
})

describe('trovaEsercizio', () => {
  it('trova un esercizio della scheda per id', () => {
    expect(trovaEsercizio('panca-piana')?.nome).toBe('Panca piana')
  })

  it('trova anche l\'addome di un giorno', () => {
    expect(trovaEsercizio('addome-giorno-2')?.nome).toBe('Addome alla sbarra')
  })

  it('restituisce undefined per un id sconosciuto', () => {
    expect(trovaEsercizio('non-esiste')).toBeUndefined()
  })
})
