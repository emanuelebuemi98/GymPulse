import { db } from './db'

// I dati dell'account di chi è entrato. L'email è l'indirizzo confermato con il codice, o null.
export async function leggiUtente(userId: number) {
  return db.user.findUnique({
    where: { id: userId },
    select: { fullName: true, username: true, email: true, palestra: true, ruolo: true },
  })
}

// Quanto c'è nell'account: serve a dire, prima di eliminarlo, cosa sparisce davvero. Le giornate sono solo quelle in scheda (le
// altre, tolte e rimaste per lo storico, spariscono comunque con le loro sedute).
export async function contaDatiAccount(userId: number) {
  const [giornate, esercizi, sedute, serie] = await Promise.all([
    db.giornoScheda.count({ where: { userId, attiva: true } }),
    db.esercizio.count({ where: { userId } }),
    db.sessione.count({ where: { userId } }),
    db.serieEseguita.count({ where: { userId } }),
  ])
  return { giornate, esercizi, sedute, serie }
}
