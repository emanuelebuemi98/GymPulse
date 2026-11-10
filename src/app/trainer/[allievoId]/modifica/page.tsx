import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { EditorScheda } from '@/components/EditorScheda'
import { allievoDelTrainer, richiediTrainer } from '@/lib/accesso'
import { leggiElenco, leggiGiorno } from '@/lib/scheda-db'
import { idDaParametro, primoParametro } from '@/lib/url'

// Legge il database a ogni richiesta: l'editor parte dalla scheda salvata.
export const dynamic = 'force-dynamic'

export const metadata: Metadata = { title: 'Modifica la scheda dell’allievo' }

type Props = {
  params: Promise<{ allievoId: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

// L'editor della scheda, aperto da un personal trainer sulla scheda di un utente della sua palestra. Gli esercizi che si possono
// aggiungere sono quelli dell'allievo più tutto il catalogo (leggiElenco gli passa lo userId dell'allievo, non quello del trainer).
export default async function ModificaSchedaAllievoPage({ params, searchParams }: Props) {
  const { userId: trainerId } = await richiediTrainer()
  const allievoId = idDaParametro((await params).allievoId)
  if (allievoId === null) notFound()
  if (!(await allievoDelTrainer(trainerId, allievoId))) notFound()

  const id = primoParametro((await searchParams).r)
  const [giorno, elenco] = await Promise.all([id ? leggiGiorno(allievoId, id) : null, leggiElenco(allievoId)])
  if (!giorno) notFound()

  // `key` riporta l'editor allo stato salvato quando si cambia giornata.
  return (
    <EditorScheda
      key={giorno.id}
      utenteId={trainerId}
      giorno={giorno}
      elenco={elenco}
      allievoId={allievoId}
      base={`/trainer/${allievoId}`}
    />
  )
}
