import { db } from './db'

// Quello che un personal trainer può leggere degli utenti della sua palestra: id (per aprirne la scheda) e nome completo. Nient'altro
// esce dal database da qui: niente nome utente, email, sedute o kg. Sono solo gli utenti (non gli altri trainer) che hanno scelto la
// stessa palestra, perché sceglierla è il consenso.
export type Allievo = { id: number; fullName: string }

export async function leggiAllievi(palestra: string): Promise<Allievo[]> {
  const righe = await db.user.findMany({
    where: { ruolo: 'utente', palestra },
    select: { id: true, fullName: true },
  })
  return righe.sort((a, b) => a.fullName.localeCompare(b.fullName, 'it'))
}

// I nomi dei personal trainer che, scegliendo una palestra, possono vedere e modificare la propria scheda: li mostra la pagina
// Account a chi ha scelto la palestra, così sa chi ha accesso.
export async function leggiTrainerDellaPalestra(palestra: string): Promise<string[]> {
  const righe = await db.user.findMany({ where: { ruolo: 'trainer', palestra }, select: { fullName: true } })
  return righe.map((riga) => riga.fullName).sort((a, b) => a.localeCompare(b, 'it'))
}
