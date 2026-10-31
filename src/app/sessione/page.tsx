import type { Metadata } from 'next'
import { FormSessione } from '@/components/FormSessione'
import { stileCarta } from '@/components/stili'
import { giornoConsigliato } from '@/lib/allenamento'
import { dataIso } from '@/lib/formato'
import { leggiCatalogo, leggiScheda } from '@/lib/scheda-db'
import { riepilogoHome, ultimeVolte } from '@/lib/storico'
import { primoParametro } from '@/lib/url'
import { richiediUtente } from '@/lib/accesso'

// Legge il database a ogni richiesta: i suggerimenti vengono dall'ultima seduta.
export const dynamic = 'force-dynamic'

export const metadata: Metadata = { title: 'Sessione' }

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> }

export default async function SessionePage({ searchParams }: Props) {
  const userId = await richiediUtente()
  const richiesto = primoParametro((await searchParams).r)
  const [giorni, catalogo, { ultima }] = await Promise.all([leggiScheda(userId), leggiCatalogo(userId), riepilogoHome(userId)])

  if (giorni.length === 0) {
    return <p className={`${stileCarta} p-5 text-muto`}>La scheda è vuota: non c'è nessuna sessione da avviare.</p>
  }

  const giorno = giorni.find((g) => g.id === richiesto) ?? giornoConsigliato(giorni, ultima?.giornoId ?? null)
  const ultime = await ultimeVolte(userId, catalogo.map((voce) => voce.id))

  // `key` fa ripartire il form (e la sua bozza) quando si cambia giornata.
  return <FormSessione key={giorno.id} giorno={giorno} ultime={ultime} catalogo={catalogo} oggi={dataIso(new Date())} />
}
