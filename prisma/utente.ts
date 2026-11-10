import 'dotenv/config'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../src/generated/prisma/client'
import { palestraDa } from '../src/lib/palestre'
import { creaHashPassword } from '../src/lib/password'
import { giornateVuote, normalizzaNomeCompleto, validaNomeCompleto } from '../src/lib/registrazione'
import { normalizzaUsername, validaNuoveCredenziali } from '../src/lib/sessione-auth'

// Crea un account, o cambia la password di uno esistente, da terminale. Serve per il primo accesso o per recuperare
// una password; gli altri si registrano dall'app. Si lancia così:
//   NUOVO_USERNAME=emanuele NUOVA_PASSWORD=... NUOVO_NOME="Emanuele Buemi" npm run db:utente
// Le credenziali passano dall'ambiente e non dalla riga di comando, così non restano nello storico dei comandi né negli
// elenchi dei processi. Nel database finisce solo l'hash della password.
//
// Palestra e ruolo (facoltativi, per un account nuovo o già esistente):
//   NUOVA_PALESTRA="THE IRON PARADISE"      sceglie la palestra (una di quelle di src/lib/palestre.ts); "-" la toglie
//   NUOVO_RUOLO=trainer                     rende l'account un personal trainer senza passare dal codice d'invito
//   NUOVO_RUOLO=utente                      lo riporta a utente normale
// Un trainer ha sempre la palestra. Su un account già esistente si può lasciare vuota NUOVA_PASSWORD per cambiare solo palestra
// o ruolo: la password resta quella di prima.

const connectionString = process.env.DATABASE_URL
if (!connectionString) throw new Error('DATABASE_URL non è impostata: crea il file .env')

const username = normalizzaUsername(process.env.NUOVO_USERNAME ?? '')
const password = process.env.NUOVA_PASSWORD ?? ''
const nome = normalizzaNomeCompleto(process.env.NUOVO_NOME ?? '')
const palestraScritta = (process.env.NUOVA_PALESTRA ?? '').trim()
const ruoloScritto = (process.env.NUOVO_RUOLO ?? '').trim().toLowerCase()

function esci(messaggio: string): never {
  console.error(messaggio)
  process.exit(1)
}

if (ruoloScritto !== '' && ruoloScritto !== 'utente' && ruoloScritto !== 'trainer') {
  esci('NUOVO_RUOLO deve essere "utente" o "trainer".')
}
const togliPalestra = palestraScritta === '-'
const palestra = palestraScritta === '' || togliPalestra ? null : palestraDa(palestraScritta)
if (palestraScritta !== '' && !togliPalestra && palestra === null) {
  esci(`NUOVA_PALESTRA non è tra quelle ammesse (vedi src/lib/palestre.ts): "${palestraScritta}".`)
}

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString }) })

async function main() {
  const esistente = await db.user.findUnique({
    where: { username },
    select: { id: true, ruolo: true, palestra: true },
  })

  // Le credenziali si controllano se serve la password: per un account nuovo, o quando la si vuole cambiare.
  if (password !== '' || !esistente) {
    const problema = validaNuoveCredenziali(username, password)
    if (problema) {
      esci(
        `Credenziali non valide: ${problema}.\nUso: NUOVO_USERNAME=emanuele NUOVA_PASSWORD=<almeno 8 caratteri> NUOVO_NOME="Nome Cognome" npm run db:utente`,
      )
    }
  }

  const ruolo = ruoloScritto === '' ? (esistente?.ruolo ?? 'utente') : ruoloScritto
  const palestraFinale = togliPalestra ? null : (palestra ?? esistente?.palestra ?? null)
  if (ruolo === 'trainer' && palestraFinale === null) esci('Un personal trainer deve avere la palestra: imposta NUOVA_PALESTRA.')

  if (esistente) {
    await db.user.update({
      where: { id: esistente.id },
      data: {
        ...(password !== '' ? { passwordHash: await creaHashPassword(password) } : {}),
        ruolo,
        palestra: palestraFinale,
      },
    })
    console.log(
      `Account "${username}" aggiornato: ${password !== '' ? 'password cambiata, ' : ''}ruolo ${ruolo}, palestra ${palestraFinale ?? 'nessuna'}.`,
    )
    return
  }

  const erroreNome = validaNomeCompleto(nome)
  if (erroreNome) {
    esci(`Per creare un account nuovo serve il nome completo: ${erroreNome}. Imposta NUOVO_NOME="Nome Cognome".`)
  }

  const creato = await db.user.create({
    data: {
      fullName: nome,
      username,
      passwordHash: await creaHashPassword(password),
      ruolo,
      palestra: palestraFinale,
      giorni: { create: giornateVuote() },
    },
    select: { id: true },
  })
  console.log(
    `Account "${username}" creato (id ${creato.id}, ruolo ${ruolo}, palestra ${palestraFinale ?? 'nessuna'}) con la giornata A vuota. Salvato solo l'hash.`,
  )
}

main()
  .catch((errore: unknown) => {
    const codice = typeof errore === 'object' && errore !== null && 'code' in errore ? errore.code : null
    console.error(codice === 'P2002' ? 'Quel nome utente è già in uso.' : errore)
    process.exitCode = 1
  })
  .finally(() => db.$disconnect())
