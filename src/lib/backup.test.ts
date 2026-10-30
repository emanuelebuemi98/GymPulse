import { describe, expect, it } from 'vitest'
import { creaBackup, leggiBackup, type DatiBackup } from './backup'

const dati: DatiBackup = {
  esercizi: [
    { id: 'panca-piana', nome: 'Panca piana', muscoli: 'Petto', personalizzato: false },
    { id: 'x-hip-thrust-a1b2c3', nome: 'Hip thrust', muscoli: '', personalizzato: true },
  ],
  giorni: [
    {
      id: 'A',
      numero: 1,
      titolo: 'Petto',
      focus: '',
      voci: [
        {
          esercizioId: 'panca-piana',
          ordine: 1,
          tipo: 'serie',
          serie: 4,
          ripMin: 6,
          ripMax: 6,
          recuperoSec: 120,
          ripTotali: null,
          serieMin: null,
          serieMax: null,
          nota: null,
          incrementoKg: 5,
        },
      ],
    },
  ],
  sessioni: [
    {
      id: 's1',
      giornoId: 'A',
      data: new Date('2026-10-26T12:00:00.000Z'),
      note: null,
      pesoCorporeoKg: 80,
      durataMinuti: 60,
      kcalStimate: 400,
      datiIniziali: false,
      serie: [
        { esercizioId: 'panca-piana', ordine: 1, pesoKg: 60, ripetizioni: 6 },
        { esercizioId: 'x-hip-thrust-a1b2c3', ordine: 2, pesoKg: null, ripetizioni: 12 },
      ],
    },
  ],
}

const ORA = new Date('2026-10-30T10:00:00.000Z')

describe('creaBackup e leggiBackup', () => {
  it('un backup si rilegge senza perdere nulla (andata e ritorno)', () => {
    const backup = creaBackup(dati, ORA)
    const esito = leggiBackup(JSON.stringify(backup))
    expect(esito).toEqual({ ok: true, backup })
  })

  it('ha il formato e la versione attesi', () => {
    const backup = creaBackup(dati, ORA)
    expect(backup.formato).toBe('gympulse-backup')
    expect(backup.versione).toBe(1)
    expect(backup.esportatoIl).toBe(ORA.toISOString())
  })

  it('conserva date, pesi e serie senza peso', () => {
    const backup = creaBackup(dati, ORA)
    expect(backup.sessioni[0].data).toBe('2026-10-26T12:00:00.000Z')
    expect(backup.sessioni[0].serie[1]).toEqual({ esercizioId: 'x-hip-thrust-a1b2c3', ordine: 2, pesoKg: null, ripetizioni: 12 })
  })
})

describe('leggiBackup rifiuta file sbagliati', () => {
  const buono = () => JSON.parse(JSON.stringify(creaBackup(dati, ORA)))

  it('testo che non è JSON', () => {
    expect(leggiBackup('non è json')).toEqual({ ok: false, errore: 'Il file non è un JSON valido' })
  })

  it('JSON che non è un backup di GymPulse', () => {
    expect(leggiBackup('{"ciao":1}')).toEqual({ ok: false, errore: 'Il file non è un backup di GymPulse' })
    expect(leggiBackup('[]').ok).toBe(false)
    expect(leggiBackup('null').ok).toBe(false)
  })

  it('versione sconosciuta', () => {
    const b = buono()
    b.versione = 2
    expect(leggiBackup(JSON.stringify(b)).ok).toBe(false)
  })

  it('una seduta che punta a un esercizio assente', () => {
    const b = buono()
    b.sessioni[0].serie[0].esercizioId = 'non-esiste'
    expect(leggiBackup(JSON.stringify(b))).toEqual({
      ok: false,
      errore: 'Una seduta usa un esercizio che non è nel backup',
    })
  })

  it('una seduta che punta a una giornata assente', () => {
    const b = buono()
    b.sessioni[0].giornoId = 'Z'
    expect(leggiBackup(JSON.stringify(b))).toEqual({
      ok: false,
      errore: 'Una seduta usa una giornata che non è nel backup',
    })
  })

  it('una scheda che usa un esercizio assente', () => {
    const b = buono()
    b.scheda[0].voci[0].esercizioId = 'non-esiste'
    expect(leggiBackup(JSON.stringify(b))).toEqual({
      ok: false,
      errore: 'La scheda usa un esercizio che non è nel backup',
    })
  })

  it('duplicati di esercizi, giornate o sedute', () => {
    const esercizi = buono()
    esercizi.esercizi.push(esercizi.esercizi[0])
    expect(leggiBackup(JSON.stringify(esercizi)).ok).toBe(false)

    const sedute = buono()
    sedute.sessioni.push(sedute.sessioni[0])
    expect(leggiBackup(JSON.stringify(sedute))).toEqual({ ok: false, errore: 'Il backup ha sedute duplicate' })
  })

  it('valori fuori misura', () => {
    const peso = buono()
    peso.sessioni[0].serie[0].pesoKg = -1
    expect(leggiBackup(JSON.stringify(peso)).ok).toBe(false)

    const rip = buono()
    rip.sessioni[0].serie[0].ripetizioni = 0
    expect(leggiBackup(JSON.stringify(rip)).ok).toBe(false)

    const data = buono()
    data.sessioni[0].data = 'ieri'
    expect(leggiBackup(JSON.stringify(data)).ok).toBe(false)
  })
})
