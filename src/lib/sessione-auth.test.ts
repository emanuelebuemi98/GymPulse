import { describe, expect, it } from 'vitest'
import {
  creaToken,
  idUtenteDaToken,
  normalizzaUsername,
  percorsoSicuro,
  tokenValido,
  validaNuoveCredenziali,
  valutaSegreto,
} from './sessione-auth'

const SEGRETO = 'un-segreto-di-prova-lungo-almeno-32-caratteri'
const ADESSO = Date.UTC(2026, 9, 30, 12)

describe('valutaSegreto', () => {
  it('accetta un segreto lungo abbastanza', () => {
    expect(valutaSegreto(SEGRETO)).toEqual({ ok: true, segreto: SEGRETO })
  })

  it('resta chiuso se manca o è corto', () => {
    expect(valutaSegreto(undefined)).toEqual({ ok: false, problema: 'AUTH_SECRET non è impostata' })
    expect(valutaSegreto('')).toEqual({ ok: false, problema: 'AUTH_SECRET non è impostata' })
    expect(valutaSegreto('troppo-corto').ok).toBe(false)
    expect(valutaSegreto('x'.repeat(31)).ok).toBe(false)
    expect(valutaSegreto('x'.repeat(32)).ok).toBe(true)
  })
})

describe('normalizzaUsername', () => {
  it('toglie gli spazi ai lati e passa in minuscolo', () => {
    expect(normalizzaUsername('  Emanuele ')).toBe('emanuele')
    expect(normalizzaUsername('EMANUELE')).toBe('emanuele')
  })
})

describe('validaNuoveCredenziali', () => {
  it('accetta nome utente e password corretti', () => {
    expect(validaNuoveCredenziali('emanuele', 'una-password-lunga')).toBeNull()
    expect(validaNuoveCredenziali('e.buemi_98', 'x'.repeat(10))).toBeNull()
  })

  it('rifiuta nomi utente fuori formato', () => {
    for (const nome of ['', 'ab', '-emanuele', 'Emanuele', 'ema nuele', 'ema@nuele', 'a'.repeat(31), 'èmanuele']) {
      expect(validaNuoveCredenziali(nome, 'una-password-lunga'), nome).not.toBeNull()
    }
  })

  it('rifiuta password troppo corte, troppo lunghe o uguali al nome utente', () => {
    expect(validaNuoveCredenziali('emanuele', 'corta')).toContain('almeno 10')
    expect(validaNuoveCredenziali('emanuele', 'x'.repeat(201))).toContain('troppo lunga')
    expect(validaNuoveCredenziali('emanuelebuemi', 'EmanueleBuemi')).toContain('uguale al nome utente')
  })

  it('accetta una password di esattamente 10 e di esattamente 200 caratteri', () => {
    expect(validaNuoveCredenziali('emanuele', 'x'.repeat(10))).toBeNull()
    expect(validaNuoveCredenziali('emanuele', 'x'.repeat(200))).toBeNull()
  })
})

describe('creaToken, idUtenteDaToken e tokenValido', () => {
  const UTENTE = 'u_a1b2c3d4e5f6'

  it("un token appena creato è valido e restituisce l'id di chi lo ha ricevuto", () => {
    const token = creaToken(SEGRETO, UTENTE, ADESSO)
    expect(tokenValido(token, SEGRETO, ADESSO + 1000)).toBe(true)
    expect(idUtenteDaToken(token, SEGRETO, ADESSO + 1000)).toBe(UTENTE)
  })

  it('persone diverse ottengono token diversi, ciascuno con il proprio id', () => {
    const a = creaToken(SEGRETO, 'u_luca', ADESSO)
    const b = creaToken(SEGRETO, 'u_anna', ADESSO)
    expect(a).not.toBe(b)
    expect(idUtenteDaToken(a, SEGRETO, ADESSO)).toBe('u_luca')
    expect(idUtenteDaToken(b, SEGRETO, ADESSO)).toBe('u_anna')
  })

  it('resta valido fino alla scadenza e poi no', () => {
    const token = creaToken(SEGRETO, UTENTE, ADESSO, 60)
    expect(idUtenteDaToken(token, SEGRETO, ADESSO + 59_000)).toBe(UTENTE)
    expect(idUtenteDaToken(token, SEGRETO, ADESSO + 60_000)).toBeNull()
    expect(idUtenteDaToken(token, SEGRETO, ADESSO + 61_000)).toBeNull()
  })

  it('con un altro segreto non è valido', () => {
    const altro = 'un-altro-segreto-lungo-almeno-32-caratteri!'
    expect(idUtenteDaToken(creaToken(SEGRETO, UTENTE, ADESSO), altro, ADESSO)).toBeNull()
  })

  it("cambiare l'id utente a mano invalida la firma: nessuno può diventare un altro", () => {
    const [versione, , scadenza, firma] = creaToken(SEGRETO, 'u_luca', ADESSO, 60).split('.')
    const altroId = Buffer.from('u_anna').toString('base64url')
    const falso = [versione, altroId, scadenza, firma].join('.')
    expect(idUtenteDaToken(falso, SEGRETO, ADESSO)).toBeNull()
  })

  it('una scadenza modificata a mano invalida la firma', () => {
    const [versione, id, , firma] = creaToken(SEGRETO, UTENTE, ADESSO, 60).split('.')
    const allungato = [versione, id, ADESSO + 10 * 365 * 24 * 3600 * 1000, firma].join('.')
    expect(idUtenteDaToken(allungato, SEGRETO, ADESSO)).toBeNull()
  })

  it('una firma alterata o troncata non è valida', () => {
    const token = creaToken(SEGRETO, UTENTE, ADESSO)
    expect(tokenValido(token.slice(0, -1) + (token.endsWith('A') ? 'B' : 'A'), SEGRETO, ADESSO)).toBe(false)
    expect(tokenValido(token.slice(0, -4), SEGRETO, ADESSO)).toBe(false)
    expect(tokenValido(token + 'x', SEGRETO, ADESSO)).toBe(false)
  })

  it('i token del vecchio formato (senza id utente) non valgono più', () => {
    expect(tokenValido('v1.9999999999999.firma', SEGRETO, ADESSO)).toBe(false)
  })

  it('rifiuta valori mancanti, vuoti o in un formato sbagliato', () => {
    const sbagliati = [undefined, '', 'non-un-token', 'v2.abc', 'v2.abc.123', 'v2..123.firma', 'v3.YQ.9999999999999.firma', 'v2.YQ.abc.firma']
    for (const token of sbagliati) {
      expect(idUtenteDaToken(token, SEGRETO, ADESSO), String(token)).toBeNull()
    }
  })

  it('senza segreto, o con un segreto corto, non accetta nulla', () => {
    const token = creaToken(SEGRETO, UTENTE, ADESSO)
    expect(tokenValido(token, undefined, ADESSO)).toBe(false)
    expect(tokenValido(token, '', ADESSO)).toBe(false)
    const corto = 'corto'
    expect(tokenValido(creaToken(corto, UTENTE, ADESSO), corto, ADESSO)).toBe(false)
  })
})

describe('percorsoSicuro', () => {
  it('accetta i percorsi interni, con parametri', () => {
    expect(percorsoSicuro('/')).toBe('/')
    expect(percorsoSicuro('/storico')).toBe('/storico')
    expect(percorsoSicuro('/scheda?r=B')).toBe('/scheda?r=B')
  })

  it("rifiuta tutto ciò che porta fuori dall'app", () => {
    for (const da of ['//sito.com', '/\\sito.com', 'https://sito.com', 'sito.com', 'javascript:alert(1)', '', '/a\nb']) {
      expect(percorsoSicuro(da), da).toBe('/')
    }
  })

  it('rifiuta valori che non sono testo e testi troppo lunghi', () => {
    expect(percorsoSicuro(undefined)).toBe('/')
    expect(percorsoSicuro(null)).toBe('/')
    expect(percorsoSicuro(42)).toBe('/')
    expect(percorsoSicuro('/' + 'a'.repeat(600))).toBe('/')
  })

  it('non rimanda alla pagina di login stessa', () => {
    expect(percorsoSicuro('/login')).toBe('/')
    expect(percorsoSicuro('/login?da=/storico')).toBe('/')
  })
})
