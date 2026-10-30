import 'dotenv/config'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../src/generated/prisma/client'
import { giorni } from '../src/data/scheda'
import { UTENTE_LOCALE_ID, UTENTE_LOCALE_NOME } from '../src/lib/utente'

const connectionString = process.env.DATABASE_URL
if (!connectionString) throw new Error('DATABASE_URL non è impostata: crea il file .env')

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString }) })

// Idempotente: si può rieseguire senza creare duplicati.
async function main() {
  await db.user.upsert({
    where: { id: UTENTE_LOCALE_ID },
    update: { name: UTENTE_LOCALE_NOME },
    create: { id: UTENTE_LOCALE_ID, name: UTENTE_LOCALE_NOME },
  })

  for (const giorno of giorni) {
    const dati = { numero: giorno.numero, titolo: giorno.titolo, focus: giorno.focus }
    await db.giornoScheda.upsert({
      where: { id: giorno.id },
      update: dati,
      create: { id: giorno.id, ...dati },
    })
  }

  const esercizi = giorni.flatMap((giorno) => [...giorno.esercizi, giorno.addome])
  for (const esercizio of esercizi) {
    const dati = { nome: esercizio.nome, muscoli: esercizio.muscoli }
    await db.esercizio.upsert({
      where: { id: esercizio.id },
      update: dati,
      create: { id: esercizio.id, ...dati },
    })
  }

  console.log(`Seed completato: ${giorni.length} giorni, ${esercizi.length} esercizi.`)
}

main()
  .catch((errore) => {
    console.error(errore)
    process.exitCode = 1
  })
  .finally(() => db.$disconnect())
