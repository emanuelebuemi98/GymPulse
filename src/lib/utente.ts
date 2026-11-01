import { db } from './db'

// I dati dell'account di chi è entrato. L'email è l'indirizzo confermato con il codice, o null.
export async function leggiUtente(userId: number) {
  return db.user.findUnique({
    where: { id: userId },
    select: { fullName: true, username: true, email: true },
  })
}
