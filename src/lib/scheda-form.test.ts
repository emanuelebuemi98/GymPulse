import { describe, expect, it } from 'vitest'
import type { Esercizio } from './scheda-tipi'
import { nuovaVoceForm, voceFormDaEsercizio, vocePerInvio } from './scheda-form'

const panca: Esercizio = {
  id: 'panca-piana',
  nome: 'Panca piana',
  muscoli: 'Petto',
  obiettivo: { tipo: 'serie', serie: 4, ripMin: 6, ripMax: 6, recuperoSec: 120 },
  nota: 'Carico a salire (+5 kg)',
  incrementoKg: 5,
}
const addomeSbarra: Esercizio = {
  id: 'addome-sbarra',
  nome: 'Addome alla sbarra',
  muscoli: 'Addominali',
  obiettivo: { tipo: 'totale', ripTotali: 50 },
}
const addomeLibero: Esercizio = {
  id: 'addome-libero',
  nome: 'Addome a piacere',
  muscoli: 'Addominali',
  obiettivo: { tipo: 'libero', serieMin: 3, serieMax: 4 },
}

describe('voceFormDaEsercizio e vocePerInvio', () => {
  it('andata e ritorno per un esercizio a serie', () => {
    const voce = vocePerInvio(voceFormDaEsercizio(panca))
    expect(voce).toMatchObject({
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
      incrementoKg: 5,
    })
  })

  it('per gli altri tipi azzera i campi che non servono', () => {
    expect(vocePerInvio(voceFormDaEsercizio(addomeSbarra))).toMatchObject({
      tipo: 'totale',
      ripTotali: 50,
      serie: null,
      ripMin: null,
      recuperoSec: null,
    })
    expect(vocePerInvio(voceFormDaEsercizio(addomeLibero))).toMatchObject({
      tipo: 'libero',
      serieMin: 3,
      serieMax: 4,
      serie: null,
      ripTotali: null,
    })
  })

  it('cambiando tipo i vecchi numeri non vengono inviati', () => {
    const voce = { ...voceFormDaEsercizio(panca), tipo: 'totale' as const, ripTotali: '40' }
    expect(vocePerInvio(voce)).toMatchObject({ tipo: 'totale', ripTotali: 40, serie: null, ripMin: null })
  })

  it('accetta la virgola nell\'incremento e svuota la nota vuota', () => {
    const voce = { ...voceFormDaEsercizio(panca), incrementoKg: '2,5', nota: '   ' }
    expect(vocePerInvio(voce)).toMatchObject({ incrementoKg: 2.5, nota: null })
  })

  it('segnala i numeri scritti male', () => {
    const voce = { ...voceFormDaEsercizio(panca), serie: 'abc' }
    expect(vocePerInvio(voce)).toEqual({ errore: 'Controlla i numeri di Panca piana' })
    const decimali = { ...voceFormDaEsercizio(panca), ripMin: '6.5' }
    expect(vocePerInvio(decimali)).toEqual({ errore: 'Controlla i numeri di Panca piana' })
  })

  it('i campi vuoti diventano null, così sarà il server a chiedere quello che manca', () => {
    expect(vocePerInvio({ ...voceFormDaEsercizio(panca), serie: '' })).toMatchObject({ serie: null })
  })
})

describe('nuovaVoceForm', () => {
  it('per un esercizio del catalogo tiene l\'id e non ha un nome nuovo', () => {
    const voce = nuovaVoceForm('k1', { esercizioId: 'curl-ez', nome: 'Curl EZ' })
    expect(voce).toMatchObject({ esercizioId: 'curl-ez', nomeNuovo: '', nome: 'Curl EZ', tipo: 'serie' })
    expect(vocePerInvio(voce)).toMatchObject({ esercizioId: 'curl-ez', nomeNuovo: null, serie: 3, ripMin: 8, ripMax: 10 })
  })

  it('per un esercizio nuovo manda il nome e nessun id', () => {
    const voce = nuovaVoceForm('k2', { nomeNuovo: '  Hip thrust ' })
    expect(vocePerInvio(voce)).toMatchObject({ esercizioId: null, nomeNuovo: 'Hip thrust' })
  })
})
