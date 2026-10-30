import 'dotenv/config'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../src/generated/prisma/client'
import { sessioniIniziali } from '../src/data/dati-iniziali'
import { schedaPredefinita } from '../src/data/scheda'
import { sessioneDaIniziale } from '../src/lib/iniziali'
import { UTENTE_LOCALE_ID, UTENTE_LOCALE_NOME } from '../src/lib/utente'
import { campiObiettivo } from '../src/lib/voci'

const connectionString = process.env.DATABASE_URL
if (!connectionString) throw new Error('DATABASE_URL non è impostata: crea il file .env')

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString }) })

// Si può rieseguire senza rovinare nulla:
// - l'utente e il catalogo degli esercizi vengono aggiornati;
// - la scheda viene creata SOLO se manca (se l'hai modificata dall'app, non la tocco);
// - le sedute iniziali vengono create SOLO se non ci sono già (se le hai cancellate o corrette, non tornano).
async function main() {
  await db.user.upsert({
    where: { id: UTENTE_LOCALE_ID },
    update: { name: UTENTE_LOCALE_NOME },
    create: { id: UTENTE_LOCALE_ID, name: UTENTE_LOCALE_NOME },
  })

  const esercizi = schedaPredefinita.flatMap((giorno) => giorno.esercizi)
  for (const esercizio of esercizi) {
    await db.esercizio.upsert({
      where: { id: esercizio.id },
      update: {},
      create: { id: esercizio.id, nome: esercizio.nome, muscoli: esercizio.muscoli },
    })
  }

  let giorniCreati = 0
  for (const giorno of schedaPredefinita) {
    const esiste = await db.giornoScheda.findUnique({ where: { id: giorno.id }, select: { id: true } })
    if (esiste) continue

    await db.giornoScheda.create({
      data: {
        id: giorno.id,
        numero: giorno.numero,
        titolo: giorno.titolo,
        focus: giorno.focus,
        voci: {
          create: giorno.esercizi.map((esercizio, indice) => ({
            esercizioId: esercizio.id,
            ordine: indice + 1,
            nota: esercizio.nota ?? null,
            incrementoKg: esercizio.incrementoKg ?? null,
            ...campiObiettivo(esercizio.obiettivo),
          })),
        },
      },
    })
    giorniCreati++
  }

  let sedutePrima = await db.sessione.count({ where: { userId: UTENTE_LOCALE_ID } })
  let seduteCreate = 0
  if (sedutePrima === 0) {
    for (const sessione of sessioniIniziali) {
      await db.sessione.create({ data: sessioneDaIniziale(sessione, UTENTE_LOCALE_ID) })
      seduteCreate++
    }
  }

  console.log(
    `Seed completato: ${esercizi.length} esercizi, ${giorniCreati} giornate nuove, ${seduteCreate} sedute iniziali.`,
  )
  if (sedutePrima > 0) console.log('Sedute già presenti: quelle iniziali non sono state aggiunte.')
}

main()
  .catch((errore) => {
    console.error(errore)
    process.exitCode = 1
  })
  .finally(() => db.$disconnect())
