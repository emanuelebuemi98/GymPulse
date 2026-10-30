import 'dotenv/config'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../src/generated/prisma/client'
import { creaHashPassword } from '../src/lib/password'
import { normalizzaUsername, validaNuoveCredenziali } from '../src/lib/sessione-auth'
import { giornateVuote } from '../src/lib/registrazione'
import { UTENTE_LOCALE_ID, UTENTE_LOCALE_NOME, creaIdUtente } from '../src/lib/utente'

// Crea un account, o cambia la password di uno esistente. Si lancia da terminale:
//   NUOVO_USERNAME=emanuele NUOVA_PASSWORD=... npm run db:utente
// La password passa dall'ambiente e non dalla riga di comando, così non resta nello storico dei comandi
// né negli elenchi dei processi. Nel database finisce solo l'hash.
//
// Il primo account che crei con questo comando è il tuo e prende l'id storico dell'app (UTENTE_LOCALE_ID), così
// le sedute già salvate prima del login restano tue. Gli altri si registrano dall'app con il codice di invito.

const connectionString = process.env.DATABASE_URL
if (!connectionString) throw new Error('DATABASE_URL non è impostata: crea il file .env')

const username = normalizzaUsername(process.env.NUOVO_USERNAME ?? '')
const password = process.env.NUOVA_PASSWORD ?? ''

const problema = validaNuoveCredenziali(username, password)
if (problema) {
  console.error(`Credenziali non valide: ${problema}.`)
  console.error('Uso: NUOVO_USERNAME=emanuele NUOVA_PASSWORD=<almeno 10 caratteri> npm run db:utente')
  process.exit(1)
}

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString }) })

async function main() {
  const passwordHash = await creaHashPassword(password)

  const esistente = await db.user.findUnique({ where: { username }, select: { id: true } })
  if (esistente) {
    await db.user.update({ where: { id: esistente.id }, data: { passwordHash } })
    console.log(`Password di "${username}" aggiornata. Salvato solo l'hash.`)
    return
  }

  // Primo account: prende l'id storico (se libero), con le sue giornate vuote se non le ha già.
  const storico = await db.user.findUnique({ where: { id: UTENTE_LOCALE_ID }, select: { username: true } })
  if (storico && !storico.username) {
    await db.user.update({ where: { id: UTENTE_LOCALE_ID }, data: { username, passwordHash, name: username } })
    console.log(`Account "${username}" collegato ai dati esistenti. Salvato solo l'hash.`)
    return
  }

  await db.user.create({
    data: {
      id: storico ? creaIdUtente() : UTENTE_LOCALE_ID,
      name: storico ? username : UTENTE_LOCALE_NOME,
      username,
      passwordHash,
      giorni: { create: giornateVuote() },
    },
  })
  console.log(`Account "${username}" creato con le giornate A, B e C vuote. Salvato solo l'hash.`)
}

main()
  .catch((errore: unknown) => {
    const codice = typeof errore === 'object' && errore !== null && 'code' in errore ? errore.code : null
    console.error(codice === 'P2002' ? 'Quel nome utente è già in uso.' : errore)
    process.exitCode = 1
  })
  .finally(() => db.$disconnect())
