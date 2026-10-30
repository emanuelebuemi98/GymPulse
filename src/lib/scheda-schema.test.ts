import { describe, expect, it } from 'vitest'
import { validaScheda } from './scheda-schema'

type VoceTest = {
  esercizioId: string | null
  nomeNuovo: string | null
  tipo: 'serie' | 'totale' | 'libero'
  serie: number | null
  ripMin: number | null
  ripMax: number | null
  recuperoSec: number | null
  ripTotali: number | null
  serieMin: number | null
  serieMax: number | null
  nota: string | null
  incrementoKg: number | null
}

const voce = (patch: Partial<VoceTest> = {}): VoceTest => ({
  esercizioId: 'panca-piana',
  nomeNuovo: null,
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
  ...patch,
})

const scheda = (voci: VoceTest[] = [voce()], patch = {}) => ({
  giornoId: 'A',
  titolo: 'Petto e braccia',
  focus: '',
  voci,
  ...patch,
})

describe('validaScheda', () => {
  it('accetta una scheda corretta e ne normalizza gli obiettivi', () => {
    const esito = validaScheda(scheda())
    expect(esito.ok).toBe(true)
    if (esito.ok) {
      expect(esito.dati.voci[0].obiettivo).toEqual({
        tipo: 'serie',
        serie: 4,
        ripMin: 6,
        ripMax: 6,
        recuperoSec: 120,
      })
    }
  })

  it('se manca il massimo delle ripetizioni usa il minimo, e il recupero predefinito se manca', () => {
    const esito = validaScheda(scheda([voce({ ripMin: 8, ripMax: null, recuperoSec: null })]))
    expect(esito.ok && esito.dati.voci[0].obiettivo).toEqual({
      tipo: 'serie',
      serie: 4,
      ripMin: 8,
      ripMax: 8,
      recuperoSec: 90,
    })
  })

  it('accetta gli obiettivi a totale e a serie libere', () => {
    const totale = voce({ tipo: 'totale', ripTotali: 50, serie: null, ripMin: null, ripMax: null, recuperoSec: null })
    const libero = voce({
      esercizioId: 'altro',
      tipo: 'libero',
      serieMin: 3,
      serieMax: 4,
      serie: null,
      ripMin: null,
      ripMax: null,
      recuperoSec: null,
    })
    expect(validaScheda(scheda([totale, libero])).ok).toBe(true)
  })

  it('accetta un esercizio nuovo, indicato per nome', () => {
    expect(validaScheda(scheda([voce({ esercizioId: null, nomeNuovo: 'Hip thrust' })])).ok).toBe(true)
  })

  it('rifiuta una scheda vuota o senza titolo', () => {
    expect(validaScheda(scheda([]))).toEqual({ ok: false, errore: 'Aggiungi almeno un esercizio' })
    expect(validaScheda(scheda([voce()], { titolo: '   ' }))).toEqual({ ok: false, errore: 'Scrivi un titolo' })
  })

  it('rifiuta un massimo di ripetizioni sotto il minimo', () => {
    expect(validaScheda(scheda([voce({ ripMin: 8, ripMax: 6 })]))).toEqual({
      ok: false,
      errore: 'Il massimo delle ripetizioni non può essere sotto il minimo',
    })
  })

  it('rifiuta numeri fuori misura', () => {
    expect(validaScheda(scheda([voce({ serie: 0 })])).ok).toBe(false)
    expect(validaScheda(scheda([voce({ serie: 21 })])).ok).toBe(false)
    expect(validaScheda(scheda([voce({ recuperoSec: 901 })])).ok).toBe(false)
    expect(validaScheda(scheda([voce({ ripMin: 2.5 })])).ok).toBe(false)
    expect(validaScheda(scheda([voce({ incrementoKg: -5 })])).ok).toBe(false)
  })

  it('rifiuta una voce di tipo "serie" senza serie o ripetizioni', () => {
    expect(validaScheda(scheda([voce({ serie: null })]))).toEqual({
      ok: false,
      errore: 'Indica serie e ripetizioni di ogni esercizio',
    })
    expect(validaScheda(scheda([voce({ ripMin: null })])).ok).toBe(false)
  })

  it('rifiuta esercizi ripetuti', () => {
    expect(validaScheda(scheda([voce(), voce()]))).toEqual({ ok: false, errore: 'Esercizio ripetuto' })
    expect(
      validaScheda(
        scheda([voce({ esercizioId: null, nomeNuovo: 'Hip thrust' }), voce({ esercizioId: null, nomeNuovo: 'HIP THRUST' })]),
      ),
    ).toEqual({ ok: false, errore: 'Esercizio ripetuto' })
  })

  it('rifiuta una voce con id e nome insieme, o con nessuno dei due', () => {
    expect(validaScheda(scheda([voce({ nomeNuovo: 'Altro' })])).ok).toBe(false)
    expect(validaScheda(scheda([voce({ esercizioId: null })])).ok).toBe(false)
  })

  it('azzera l\'incremento 0 e la nota vuota', () => {
    const esito = validaScheda(scheda([voce({ incrementoKg: 0, nota: '' })]))
    expect(esito.ok && [esito.dati.voci[0].incrementoKg, esito.dati.voci[0].nota]).toEqual([null, null])
  })
})
