import { describe, expect, it } from 'vitest'
import { creaHashPassword, hashFittizio, verificaPassword } from './password'

// Costo basso: nei test non serve la sicurezza, serve la velocità.
const LEGGERO = { n: 2 ** 10, r: 8, p: 1 }

describe('creaHashPassword e verificaPassword', () => {
  it('la password giusta è accettata, quella sbagliata no', async () => {
    const hash = await creaHashPassword('una-password-lunga', LEGGERO)
    expect(await verificaPassword('una-password-lunga', hash)).toBe(true)
    expect(await verificaPassword('una-password-lungA', hash)).toBe(false)
    expect(await verificaPassword('', hash)).toBe(false)
    expect(await verificaPassword('una-password-lunga ', hash)).toBe(false)
  })

  it('l\'hash non contiene la password e ha il formato atteso', async () => {
    const hash = await creaHashPassword('una-password-lunga', LEGGERO)
    expect(hash).not.toContain('una-password-lunga')
    expect(hash.split('$')).toHaveLength(6)
    expect(hash.startsWith('scrypt$1024$8$1$')).toBe(true)
  })

  it('due hash della stessa password sono diversi (sale casuale) ma validi entrambi', async () => {
    const a = await creaHashPassword('una-password-lunga', LEGGERO)
    const b = await creaHashPassword('una-password-lunga', LEGGERO)
    expect(a).not.toBe(b)
    expect(await verificaPassword('una-password-lunga', a)).toBe(true)
    expect(await verificaPassword('una-password-lunga', b)).toBe(true)
  })

  it('con il costo predefinito funziona e usa parametri robusti', async () => {
    const hash = await creaHashPassword('una-password-lunga')
    expect(hash.startsWith('scrypt$32768$8$1$')).toBe(true)
    expect(await verificaPassword('una-password-lunga', hash)).toBe(true)
  })

  it('la stessa password scritta in forma Unicode diversa dà lo stesso risultato', async () => {
    const hash = await creaHashPassword('perché-è-così', LEGGERO)
    expect(await verificaPassword('perché-è-così'.replace('così', 'così'), hash)).toBe(true)
  })

  it('gestisce password lunghe e caratteri speciali', async () => {
    const lunga = 'p@ss wörd/😀'.repeat(15)
    const hash = await creaHashPassword(lunga, LEGGERO)
    expect(await verificaPassword(lunga, hash)).toBe(true)
    expect(await verificaPassword(lunga.slice(0, -1), hash)).toBe(false)
  })
})

describe('verificaPassword con un hash rovinato', () => {
  it('risponde falso, senza lanciare errori', async () => {
    const buono = await creaHashPassword('una-password-lunga', LEGGERO)
    const [, n, r, p, sale, chiave] = buono.split('$')
    const casi = [
      '',
      'non-un-hash',
      'bcrypt$1024$8$1$' + sale + '$' + chiave,
      `scrypt$${n}$${r}$${p}$${sale}`,
      `scrypt$${n}$${r}$${p}$${sale}$${chiave}$extra`,
      `scrypt$abc$${r}$${p}$${sale}$${chiave}`,
      `scrypt$1000$${r}$${p}$${sale}$${chiave}`, // non è una potenza di due
      `scrypt$512$${r}$${p}$${sale}$${chiave}`, // troppo basso
      `scrypt$${2 ** 20}$${r}$${p}$${sale}$${chiave}`, // troppo alto: non deve bloccare il server
      `scrypt$${n}$0$${p}$${sale}$${chiave}`,
      `scrypt$${n}$${r}$99$${sale}$${chiave}`,
      `scrypt$${n}$${r}$${p}$$${chiave}`,
      `scrypt$${n}$${r}$${p}$${sale}$`,
    ]
    for (const caso of casi) {
      expect(await verificaPassword('una-password-lunga', caso), caso).toBe(false)
    }
  })

  it('una chiave modificata di un solo carattere non è valida', async () => {
    const hash = await creaHashPassword('una-password-lunga', LEGGERO)
    const alterato = hash.slice(0, -1) + (hash.endsWith('A') ? 'B' : 'A')
    expect(await verificaPassword('una-password-lunga', alterato)).toBe(false)
  })
})

describe('hashFittizio', () => {
  it('è un hash valido, sempre lo stesso nella stessa esecuzione, e nessuna password reale lo apre', async () => {
    const a = await hashFittizio()
    expect(a).toBe(await hashFittizio())
    expect(a.startsWith('scrypt$')).toBe(true)
    expect(await verificaPassword('una-password-lunga', a)).toBe(false)
    expect(await verificaPassword('', a)).toBe(false)
  })
})
