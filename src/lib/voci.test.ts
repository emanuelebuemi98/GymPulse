import { describe, expect, it } from 'vitest'
import { schedaPredefinita, type Obiettivo } from '../data/scheda'
import { campiObiettivo, esercizioDaVoce, type VoceDb } from './voci'

const base: VoceDb = {
  tipo: 'serie',
  serie: 4,
  ripMin: 6,
  ripMax: 6,
  recuperoSec: 120,
  ripTotali: null,
  serieMin: null,
  serieMax: null,
  nota: null,
  incrementoKg: null,
  esercizio: { id: 'panca-piana', nome: 'Panca piana', muscoli: 'Petto' },
}

describe('esercizioDaVoce', () => {
  it('ricostruisce un obiettivo a serie', () => {
    expect(esercizioDaVoce(base).obiettivo).toEqual({ tipo: 'serie', serie: 4, ripMin: 6, ripMax: 6, recuperoSec: 120 })
  })

  it('ricostruisce un obiettivo a totale e uno a serie libere', () => {
    const totale = esercizioDaVoce({ ...base, tipo: 'totale', ripTotali: 50, serie: null, ripMin: null, ripMax: null, recuperoSec: null })
    expect(totale.obiettivo).toEqual({ tipo: 'totale', ripTotali: 50 })
    const libero = esercizioDaVoce({ ...base, tipo: 'libero', serieMin: 3, serieMax: 4, serie: null, ripMin: null, ripMax: null, recuperoSec: null })
    expect(libero.obiettivo).toEqual({ tipo: 'libero', serieMin: 3, serieMax: 4 })
  })

  it('con valori mancanti usa dei predefiniti sensati invece di rompersi', () => {
    const vuoto = esercizioDaVoce({ ...base, serie: null, ripMin: null, ripMax: null, recuperoSec: null })
    expect(vuoto.obiettivo).toEqual({ tipo: 'serie', serie: 3, ripMin: 8, ripMax: 8, recuperoSec: 90 })
  })

  it('porta con sé nota e incremento solo se ci sono', () => {
    expect(esercizioDaVoce(base)).not.toHaveProperty('nota')
    expect(esercizioDaVoce(base)).not.toHaveProperty('incrementoKg')
    const completo = esercizioDaVoce({ ...base, nota: 'Senza compensi', incrementoKg: 5 })
    expect(completo).toMatchObject({ nota: 'Senza compensi', incrementoKg: 5 })
  })
})

describe('campiObiettivo', () => {
  const obiettivi: Obiettivo[] = [
    { tipo: 'serie', serie: 3, ripMin: 6, ripMax: 8, recuperoSec: 90 },
    { tipo: 'totale', ripTotali: 50 },
    { tipo: 'libero', serieMin: 3, serieMax: 4 },
  ]

  it('lascia vuote le colonne che non servono al tipo', () => {
    expect(campiObiettivo(obiettivi[1])).toEqual({
      tipo: 'totale',
      serie: null,
      ripMin: null,
      ripMax: null,
      recuperoSec: null,
      ripTotali: 50,
      serieMin: null,
      serieMax: null,
    })
  })

  it('andata e ritorno: ogni obiettivo della scheda predefinita resta uguale', () => {
    const esercizi = schedaPredefinita.flatMap((g) => g.esercizi)
    for (const esercizio of esercizi) {
      const campi = campiObiettivo(esercizio.obiettivo)
      const di = { ...base, ...campi, esercizio: { id: esercizio.id, nome: esercizio.nome, muscoli: esercizio.muscoli } }
      expect(esercizioDaVoce(di).obiettivo, esercizio.id).toEqual(esercizio.obiettivo)
    }
  })

  it('andata e ritorno anche per gli obiettivi di esempio', () => {
    for (const obiettivo of obiettivi) {
      expect(esercizioDaVoce({ ...base, ...campiObiettivo(obiettivo) }).obiettivo).toEqual(obiettivo)
    }
  })
})
