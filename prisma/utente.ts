import 'dotenv/config'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../src/generated/prisma/client'
import { creaHashPassword } from '../src/lib/password'
import { giornateVuote, normalizzaNomeCompleto, validaNomeCompleto } from '../src/lib/registrazione'
import { normalizzaUsername, validaNuoveCredenziali } from '../src/lib/sessione-auth'

// Crea un account, o cambia la password di uno esistente, da terminale. Serve per il primo accesso o per recuperare
// una password; gli altri si registrano dall'app. Si lancia così:
//   NUOVO_USERNAME=emanuele NUOVA_PASSWORD=... NUOVO_NOME="Emanuele Buemi" npm run db:utente
// Le credenziali passano dall'ambiente e non dalla riga di comando, così non restano nello storico dei comandi né negli
// elenchi dei processi. Nel database finisce solo l'hash della password.

const connectionString = process.env.DATABASE_URL
if (!connectionString) throw new Error('DATABASE_URL non è impostata: crea il file .env')

const username = normalizzaUsername(process.env.NUOVO_USERNAME ?? '')
const password = process.env.NUOVA_PASSWORD ?? ''
const nome = normalizzaNomeCompleto(process.env.NUOVO_NOME ?? '')

const problema = validaNuoveCredenziali(username, password)
if (problema) {
  console.error(`Credenziali non valide: ${problema}.`)
  console.error('Uso: NUOVO_USERNAME=emanuele NUOVA_PASSWORD=<almeno 10 caratteri> NUOVO_NOME="Nome Cognome" npm run db:utente')
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

  const erroreNome = validaNomeCompleto(nome)
  if (erroreNome) {
    console.error(`Per creare un account nuovo serve il nome completo: ${erroreNome}. Imposta NUOVO_NOME="Nome Cognome".`)
    process.exitCode = 1
    return
  }

  const creato = await db.user.create({
    data: { fullName: nome, username, passwordHash, giorni: { create: giornateVuote() } },
    select: { id: true },
  })
  console.log(`Account "${username}" creato (id ${creato.id}) con le giornate A, B e C vuote. Salvato solo l'hash.`)
}

main()
  .catch((errore: unknown) => {
    const codice = typeof errore === 'object' && errore !== null && 'code' in errore ? errore.code : null
    console.error(codice === 'P2002' ? 'Quel nome utente è già in uso.' : errore)
    process.exitCode = 1
  })
  .finally(() => db.$disconnect())
