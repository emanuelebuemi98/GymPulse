'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { stimaKcal } from '@/lib/allenamento'
import { creaBackup, leggiBackup } from '@/lib/backup'
import { trovaOCreaEsercizio } from '@/lib/catalogo'
import { db } from '@/lib/db'
import { campiObiettivo } from '@/lib/voci'
import { validaScheda } from '@/lib/scheda-schema'
import { validaSessione } from '@/lib/sessione-schema'
import { datiPerBackup } from '@/lib/storico'
import { UTENTE_LOCALE_ID } from '@/lib/utente'

// Ogni azione è un punto d'ingresso pubblico: il browser non è fidato, quindi si ricontrolla tutto qui.

const LIMITE_BACKUP = 900_000 // caratteri: i server action accettano al massimo 1 MB

function aggiornaPagine() {
  revalidatePath('/', 'layout')
}

export async function salvaSessione(input: unknown): Promise<{ id: string } | { errore: string }> {
  const esito = validaSessione(input)
  if (!esito.ok) return { errore: esito.errore }

  const { giornoId, note, durataMinuti, pesoCorporeoKg } = esito.dati
  // Gli esercizi senza serie confermate non vengono salvati (e non ne nasce uno nuovo nel catalogo).
  const esercizi = esito.dati.esercizi.filter((esercizio) => esercizio.serie.length > 0)

  const giorno = await db.giornoScheda.findUnique({ where: { id: giornoId }, select: { id: true } })
  if (!giorno) return { errore: 'Giorno non valido' }

  const idCatalogo = esercizi.flatMap((esercizio) => (esercizio.esercizioId ? [esercizio.esercizioId] : []))
  const trovati = await db.esercizio.count({ where: { id: { in: idCatalogo } } })
  if (trovati !== idCatalogo.length) return { errore: 'Un esercizio non esiste più' }

  const kcalStimate =
    pesoCorporeoKg !== null && durataMinuti !== null ? stimaKcal(pesoCorporeoKg, durataMinuti) : null

  const id = await db.$transaction(async (tx) => {
    let ordine = 0
    const serie: { esercizioId: string; ordine: number; pesoKg: number | null; ripetizioni: number }[] = []
    for (const esercizio of esercizi) {
      const esercizioId = esercizio.esercizioId ?? (await trovaOCreaEsercizio(tx, esercizio.nomeNuovo!))
      for (const s of esercizio.serie) {
        serie.push({ esercizioId, ordine: ++ordine, pesoKg: s.pesoKg, ripetizioni: s.ripetizioni })
      }
    }

    const creata = await tx.sessione.create({
      data: {
        userId: UTENTE_LOCALE_ID,
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
  const esito = validaScheda(input)
  if (!esito.ok) return { errore: esito.errore }
  const { giornoId, titolo, focus, voci } = esito.dati

  const giorno = await db.giornoScheda.findUnique({ where: { id: giornoId }, select: { id: true } })
  if (!giorno) return { errore: 'Giornata non trovata' }

  const idCatalogo = voci.flatMap((voce) => (voce.esercizioId ? [voce.esercizioId] : []))
  const trovati = await db.esercizio.count({ where: { id: { in: idCatalogo } } })
  if (trovati !== idCatalogo.length) return { errore: 'Un esercizio non esiste più' }

  // La storia non si tocca: le serie già registrate puntano agli esercizi, non alle voci della scheda.
  await db.$transaction(async (tx) => {
    await tx.giornoScheda.update({ where: { id: giornoId }, data: { titolo, focus } })
    await tx.voceScheda.deleteMany({ where: { giornoId } })

    let ordine = 0
    for (const voce of voci) {
      const esercizioId = voce.esercizioId ?? (await trovaOCreaEsercizio(tx, voce.nomeNuovo!))
      await tx.voceScheda.create({
        data: {
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
  if (typeof id !== 'string' || id === '') return { errore: 'Seduta non valida' }

  const { count } = await db.sessione.deleteMany({ where: { id, userId: UTENTE_LOCALE_ID } })
  if (count === 0) return { errore: 'Seduta non trovata' }

  aggiornaPagine()
  redirect('/storico')
}

// Sostituisce TUTTO (scheda, esercizi e sedute) con il contenuto del backup. Il chiamante chiede conferma.
export async function importaBackup(testo: unknown): Promise<{ sedute: number } | { errore: string }> {
  if (typeof testo !== 'string') return { errore: 'File non valido' }
  if (testo.length > LIMITE_BACKUP) return { errore: 'Il file è troppo grande per essere importato' }

  const esito = leggiBackup(testo)
  if (!esito.ok) return { errore: esito.errore }
  const { esercizi, scheda, sessioni } = esito.backup

  await db.$transaction(
    async (tx) => {
      await tx.sessione.deleteMany({ where: { userId: UTENTE_LOCALE_ID } })
      await tx.voceScheda.deleteMany()
      await tx.giornoScheda.deleteMany()
      await tx.esercizio.deleteMany()

      await tx.esercizio.createMany({ data: esercizi })
      await tx.giornoScheda.createMany({
        data: scheda.map(({ id, numero, titolo, focus }) => ({ id, numero, titolo, focus })),
      })
      await tx.voceScheda.createMany({
        data: scheda.flatMap((giorno) => giorno.voci.map((voce) => ({ ...voce, giornoId: giorno.id }))),
      })
      await tx.sessione.createMany({
        data: sessioni.map(({ serie: _serie, data, ...resto }) => ({
          ...resto,
          data: new Date(data),
          userId: UTENTE_LOCALE_ID,
        })),
      })
      await tx.serieEseguita.createMany({
        data: sessioni.flatMap((sessione) =>
          sessione.serie.map((serie) => ({ ...serie, sessioneId: sessione.id })),
        ),
      })
    },
    { timeout: 30_000 },
  )

  aggiornaPagine()
  return { sedute: sessioni.length }
}

// Per i test e per l'esportazione: i dati nella forma del file di backup.
export async function leggiBackupCorrente() {
  return creaBackup(await datiPerBackup())
}
