import { db } from './db'

// Quello che un personal trainer può leggere degli utenti della sua palestra: id (per aprirne la scheda) e nome completo. Nient'altro
// esce dal database da qui: niente nome utente, email, sedute o kg. Sono solo gli utenti (non i trainer) che hanno scelto la
// stessa palestra, perché sceglierla è il consenso.
export type Allievo = { id: number; fullName: string }

export async function leggiAllievi(palestra: string): Promise<Allievo[]> {
  const righe = await db.user.findMany({
    where: { ruolo: 'utente', palestra },
    select: { id: true, fullName: true },
  })
  return righe.sort((a, b) => a.fullName.localeCompare(b.fullName, 'it'))
}

// Il nome del personal trainer che, scegliendo una palestra, può vedere e modificare la propria scheda: lo mostra la pagina Account
// a chi ha scelto la palestra, così sa chi ha accesso. Per ogni palestra c'è al massimo UN trainer (indice unico parziale nel
// database, vedi la migrazione un_trainer_per_palestra); null se ancora nessuno si è registrato.
export async function leggiTrainerDellaPalestra(palestra: string): Promise<string | null> {
  const riga = await db.user.findFirst({ where: { ruolo: 'trainer', palestra }, select: { fullName: true } })
  return riga?.fullName ?? null
}

// Vero se la palestra ha già il suo personal trainer. Serve alla registrazione, che lo controlla prima di calcolare l'hash della
// password; la regola vera sta comunque nel database, e vale anche se due persone si registrano nello stesso istante.
export async function palestraHaTrainer(palestra: string): Promise<boolean> {
  return (await db.user.count({ where: { ruolo: 'trainer', palestra } })) > 0
}
