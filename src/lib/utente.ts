// Identificativo dell'account creato prima che esistesse il login, quando l'app aveva un solo utente.
// Serve solo alla migrazione dei dati esistenti e allo script `npm run db:utente`: da qui in poi l'utente
// di ogni richiesta si ricava dal cookie di sessione (vedi lib/accesso.ts), mai da una costante.
export const UTENTE_LOCALE_ID = 'atleta-locale'
export const UTENTE_LOCALE_NOME = 'Atleta'

// Id di un nuovo account: casuale e non indovinabile. Compare nel cookie firmato, non nell'indirizzo.
export function creaIdUtente(): string {
  return `u_${crypto.randomUUID().replaceAll('-', '')}`
}

// Id di una seduta importata da un backup: casuale, così non può scontrarsi con quelli già nel database.
export function creaIdSessione(): string {
  return `s_${crypto.randomUUID().replaceAll('-', '')}`
}
