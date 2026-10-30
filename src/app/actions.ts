'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { utenteCorrente } from '@/lib/accesso'
import { stimaKcal } from '@/lib/allenamento'
import { leggiBackup } from '@/lib/backup'
import { trovaOCreaEsercizio } from '@/lib/catalogo'
import { db } from '@/lib/db'
import { campiObiettivo } from '@/lib/voci'
import { validaScheda } from '@/lib/scheda-schema'
import { validaSessione } from '@/lib/sessione-schema'
import { creaIdSessione } from '@/lib/utente'

// Ogni azione è un punto d'ingresso pubblico: il browser non è fidato. L'utente si ricava SEMPRE dal cookie
// firmato (utenteCorrente) e finisce in ogni query: nessun id di persona arriva mai dal form, e i dati
// di un'altra persona non sono raggiungibili nemmeno conoscendone gli id.

const LIMITE_BACKUP = 900_000 // caratteri: i server action accettano al massimo 1 MB
const NON_AUTORIZZATO = 'Sessione scaduta: accedi di nuovo e riprova (la sessione in corso è salvata nel browser).'

function aggiornaPagine() {
  revalidatePath('/', 'layout')
}

export async function salvaSessione(input: unknown): Promise<{ id: string } | { errore: string }> {
  const userId = await utenteCorrente()
  if (!userId) return { errore: NON_AUTORIZZATO }

  const esito = validaSessione(input)
  if (!esito.ok) return { errore: esito.errore }

  const { giornoId, note, durataMinuti, pesoCorporeoKg } = esito.dati
  // Gli esercizi senza serie confermate non vengono salvati (e non ne nasce uno nuovo nel catalogo).
  const esercizi = esito.dati.esercizi.filter((esercizio) => esercizio.serie.length > 0)

  const giorno = await db.giornoScheda.findUnique({
    where: { userId_id: { userId, id: giornoId } },
    select: { id: true },
  })
  if (!giorno) return { errore: 'Giorno non valido' }

  const idCatalogo = esercizi.flatMap((esercizio) => (esercizio.esercizioId ? [esercizio.esercizioId] : []))
  const trovati = await db.esercizio.count({ where: { userId, id: { in: idCatalogo } } })
  if (trovati !== idCatalogo.length) return { errore: 'Un esercizio non esiste più' }

  const kcalStimate =
    pesoCorporeoKg !== null && durataMinuti !== null ? stimaKcal(pesoCorporeoKg, durataMinuti) : null

  const id = await db.$transaction(async (tx) => {
    let ordine = 0
    const serie: { esercizioId: string; ordine: number; pesoKg: number | null; ripetizioni: number }[] = []
    for (const esercizio of esercizi) {
      const esercizioId = esercizio.esercizioId ?? (await trovaOCreaEsercizio(tx, userId, esercizio.nomeNuovo!))
      for (const s of esercizio.serie) {
        serie.push({ esercizioId, ordine: ++ordine, pesoKg: s.pesoKg, ripetizioni: s.ripetizioni })
      }
    }

    const creata = await tx.sessione.create({
      data: {
        userId,
        giornoId,
        data: esito.istante,
        note: note ? note : null,
        durataMinuti,
        pesoCorporeoKg,
        kcalStimate,
        serie: { create: serie },
      },
      select: { id: true },
    })
    return creata.id
  })

  aggiornaPagine()
  return { id }
}

export async function salvaScheda(input: unknown): Promise<{ ok: true } | { errore: string }> {
  const userId = await utenteCorrente()
  if (!userId) return { errore: NON_AUTORIZZATO }

  const esito = validaScheda(input)
  if (!esito.ok) return { errore: esito.errore }
  const { giornoId, titolo, focus, voci } = esito.dati

  const giorno = await db.giornoScheda.findUnique({
    where: { userId_id: { userId, id: giornoId } },
    select: { id: true },
  })
  if (!giorno) return { errore: 'Giornata non trovata' }

  const idCatalogo = voci.flatMap((voce) => (voce.esercizioId ? [voce.esercizioId] : []))
  const trovati = await db.esercizio.count({ where: { userId, id: { in: idCatalogo } } })
  if (trovati !== idCatalogo.length) return { errore: 'Un esercizio non esiste più' }

  // La storia non si tocca: le serie già registrate puntano agli esercizi, non alle voci della scheda.
  await db.$transaction(async (tx) => {
    await tx.giornoScheda.update({ where: { userId_id: { userId, id: giornoId } }, data: { titolo, focus } })
    await tx.voceScheda.deleteMany({ where: { userId, giornoId } })

    let ordine = 0
    for (const voce of voci) {
      const esercizioId = voce.esercizioId ?? (await trovaOCreaEsercizio(tx, userId, voce.nomeNuovo!))
      await tx.voceScheda.create({
        data: {
          userId,
          giornoId,
          esercizioId,
          ordine: ++ordine,
          nota: voce.nota,
          incrementoKg: voce.incrementoKg,
          ...campiObiettivo(voce.obiettivo),
        },
      })
    }
  })

  aggiornaPagine()
  return { ok: true }
}

export async function eliminaSessione(id: unknown): Promise<{ errore: string } | never> {
  const userId = await utenteCorrente()
  if (!userId) return { errore: NON_AUTORIZZATO }
  if (typeof id !== 'string' || id === '') return { errore: 'Seduta non valida' }

  const { count } = await db.sessione.deleteMany({ where: { id, userId } })
  if (count === 0) return { errore: 'Seduta non trovata' }

  aggiornaPagine()
  redirect('/storico')
}

// Sostituisce scheda, esercizi e sedute DI CHI LA ESEGUE con il contenuto del backup: i dati delle altre
// persone non si toccano. Il chiamante chiede conferma.
export async function importaBackup(testo: unknown): Promise<{ sedute: number } | { errore: string }> {
  const userId = await utenteCorrente()
  if (!userId) return { errore: NON_AUTORIZZATO }
  if (typeof testo !== 'string') return { errore: 'File non valido' }
  if (testo.length > LIMITE_BACKUP) return { errore: 'Il file è troppo grande per essere importato' }

  const esito = leggiBackup(testo)
  if (!esito.ok) return { errore: esito.errore }
  const { esercizi, scheda, sessioni } = esito.backup

  await db.$transaction(
    async (tx) => {
      // Cancellare le sedute porta via le loro serie; poi la scheda e il catalogo, solo di questa persona.
      await tx.sessione.deleteMany({ where: { userId } })
      await tx.voceScheda.deleteMany({ where: { userId } })
      await tx.giornoScheda.deleteMany({ where: { userId } })
      await tx.esercizio.deleteMany({ where: { userId } })

      await tx.esercizio.createMany({ data: esercizi.map((esercizio) => ({ ...esercizio, userId })) })
      await tx.giornoScheda.createMany({
        data: scheda.map(({ id, numero, titolo, focus }) => ({ userId, id, numero, titolo, focus })),
      })
      await tx.voceScheda.createMany({
        data: scheda.flatMap((giorno) => giorno.voci.map((voce) => ({ ...voce, userId, giornoId: giorno.id }))),
      })
      // L'id di una seduta è unico in tutto il database: quello scritto nel file potrebbe già esistere (per esempio
      // se il backup viene da un'altra persona, o dallo stesso account). Ogni seduta ne riceve uno nuovo, e le sue
      // serie vi si agganciano: le date, i pesi e le ripetizioni restano identici.
      const nuoviId = new Map(sessioni.map((sessione) => [sessione.id, creaIdSessione()]))
      await tx.sessione.createMany({
        data: sessioni.map(({ serie: _serie, data, id, ...resto }) => ({
          ...resto,
          id: nuoviId.get(id)!,
          userId,
          data: new Date(data),
        })),
      })
      await tx.serieEseguita.createMany({
        data: sessioni.flatMap((sessione) =>
          sessione.serie.map((serie) => ({ ...serie, userId, sessioneId: nuoviId.get(sessione.id)! })),
        ),
      })
    },
    { timeout: 30_000 },
  )

  aggiornaPagine()
  return { sedute: sessioni.length }
}
