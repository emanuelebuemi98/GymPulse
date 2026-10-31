import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { COOKIE_SESSIONE, idUtenteDaToken } from './sessione-auth'

// Chi sta facendo la richiesta, ricavato dal cookie firmato. È l'unica fonte dell'id dell'utente:
// pagine e azioni non si fidano mai di un id mandato dal browser.
export async function utenteCorrente(): Promise<number | null> {
  const archivio = await cookies()
  return idUtenteDaToken(archivio.get(COOKIE_SESSIONE)?.value, process.env.AUTH_SECRET)
}

export async function haAccesso(): Promise<boolean> {
  return (await utenteCorrente()) !== null
}

// Per le pagine e per i dati: chi non è entrato va al login. Restituisce l'id da usare in ogni query.
// Il proxy ferma già chi non è entrato, ma non basta da solo: pagine e azioni sono punti d'ingresso pubblici.
export async function richiediUtente(): Promise<number> {
  const id = await utenteCorrente()
  if (!id) redirect('/login')
  return id
}
