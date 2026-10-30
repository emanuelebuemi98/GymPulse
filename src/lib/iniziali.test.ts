import { describe, expect, it } from 'vitest'
import { sessioniIniziali } from '../data/dati-iniziali'
import { schedaPredefinita } from '../data/scheda'
import { istanteIniziale, sessioneDaIniziale } from './iniziali'

const esercizi = new Map(schedaPredefinita.flatMap((g) => g.esercizi).map((e) => [e.id, e]))

describe('dati iniziali (appunti dell\'ultima settimana)', () => {
  it('ogni esercizio esiste nella scheda predefinita', () => {
    for (const sessione of sessioniIniziali) {
      for (const voce of sessione.esercizi) {
        expect(esercizi.has(voce.esercizioId), voce.esercizioId).toBe(true)
      }
    }
  })

  it("ogni esercizio appartiene alla giornata indicata", () => {
    for (const sessione of sessioniIniziali) {
      const idGiornata = new Set(schedaPredefinita.find((g) => g.id === sessione.giornoId)!.esercizi.map((e) => e.id))
      for (const voce of sessione.esercizi) {
        expect(idGiornata.has(voce.esercizioId), `${sessione.giornoId}/${voce.esercizioId}`).toBe(true)
      }
    }
  })

  it('copre tutti gli esercizi principali delle tre giornate', () => {
    for (const giorno of schedaPredefinita) {
      const registrati = new Set(sessioniIniziali.find((s) => s.giornoId === giorno.id)!.esercizi.map((v) => v.esercizioId))
      const mancanti = giorno.esercizi.filter((e) => e.id !== 'addome-giorno-1' && !registrati.has(e.id)).map((e) => e.id)
      expect(mancanti, `giornata ${giorno.id}`).toEqual([])
    }
  })

  it('ha tre sedute, ciascuna con id e data diversi', () => {
    expect(sessioniIniziali).toHaveLength(3)
    expect(new Set(sessioniIniziali.map((s) => s.id)).size).toBe(3)
    expect(new Set(sessioniIniziali.map((s) => s.data)).size).toBe(3)
  })

  it('riporta i numeri degli appunti (controllo a campione)', () => {
    const a = sessioniIniziali.find((s) => s.giornoId === 'A')!
    expect(a.esercizi.find((v) => v.esercizioId === 'panca-piana')!.kg).toEqual([40, 50, 50, 50])
    expect(a.esercizi.find((v) => v.esercizioId === 'dip-macchina')!.kg).toEqual([25, 30, 37.5])
    const b = sessioniIniziali.find((s) => s.giornoId === 'B')!
    expect(b.esercizi.find((v) => v.esercizioId === 'squat-bilanciere')!.kg).toEqual([50, 60, 70, 75])
    expect(b.esercizi.find((v) => v.esercizioId === 'calf-piedi')!.kg).toEqual([110, 110, 130, 130])
    const c = sessioniIniziali.find((s) => s.giornoId === 'C')!
    expect(c.esercizi.find((v) => v.esercizioId === 'stacco-terra')!.kg).toEqual([20, 30, 40])
    expect(c.esercizi.find((v) => v.esercizioId === 'addome-giorno-3')!.kg).toEqual([40, 40, 45, 50])
  })

  it("l'addome alla sbarra riporta 15 + 15 + 20 = 50 ripetizioni totali, senza peso", () => {
    const b = sessioniIniziali.find((s) => s.giornoId === 'B')!
    const addome = b.esercizi.find((v) => v.esercizioId === 'addome-giorno-2')!
    expect(addome.kg).toBeNull()
    expect(addome.rip).toEqual([15, 15, 20])
    expect((addome.rip as number[]).reduce((a, b) => a + b, 0)).toBe(50)
  })
})

describe('sessioneDaIniziale', () => {
  const sessioneA = sessioniIniziali.find((s) => s.giornoId === 'A')!

  it('numera le serie di seguito su tutta la sessione e le marca come dati iniziali', () => {
    const dati = sessioneDaIniziale(sessioneA, 'atleta')
    const serie = dati.serie.create
    expect(dati.datiIniziali).toBe(true)
    expect(serie.map((s) => s.ordine)).toEqual(Array.from({ length: serie.length }, (_, i) => i + 1))
    expect(serie[0]).toMatchObject({ esercizioId: 'panca-piana', pesoKg: 40, ripetizioni: 6 })
  })

  it('usa le ripetizioni indicate per ogni serie, quando sono un elenco', () => {
    const sessioneB = sessioniIniziali.find((s) => s.giornoId === 'B')!
    const serie = sessioneDaIniziale(sessioneB, 'atleta').serie.create.filter((s) => s.esercizioId === 'addome-giorno-2')
    expect(serie.map((s) => [s.pesoKg, s.ripetizioni])).toEqual([
      [null, 15],
      [null, 15],
      [null, 20],
    ])
  })

  it('rifiuta kg e ripetizioni che non coincidono', () => {
    const rotta = { ...sessioneA, esercizi: [{ esercizioId: 'panca-piana', kg: [40, 50], rip: [6] }] }
    expect(() => sessioneDaIniziale(rotta, 'atleta')).toThrow()
  })
})

describe('istanteIniziale', () => {
  it('dà il mezzogiorno UTC della data', () => {
    expect(istanteIniziale('2026-10-26').toISOString()).toBe('2026-10-26T12:00:00.000Z')
  })

  it('rifiuta una data scritta male', () => {
    expect(() => istanteIniziale('26/10/2026')).toThrow()
  })
})
