import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { AggiungiGiornata } from '@/components/AggiungiGiornata'
import { ElencoGiornata } from '@/components/ElencoGiornata'
import { IconaRegolazioni, IconaSinistra } from '@/components/icone'
import { RimuoviGiornata } from '@/components/RimuoviGiornata'
import { stileBottoneChiaro, stileCarta } from '@/components/stili'
import { TabGiorni } from '@/components/TabGiorni'
import { allievoDelTrainer, richiediTrainer } from '@/lib/accesso'
import { GIORNATE_MASSIME } from '@/lib/giornate'
import { leggiScheda } from '@/lib/scheda-db'
import { idDaParametro, primoParametro } from '@/lib/url'

// Legge il database a ogni richiesta: la scheda cambia e l'allievo può togliere la palestra in qualsiasi momento.
export const dynamic = 'force-dynamic'

export const metadata: Metadata = { title: 'Scheda dell’allievo' }

type Props = {
  params: Promise<{ allievoId: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

// La scheda di un utente della palestra del trainer: giornate, esercizi, obiettivi. Nessun carico, nessuna sessione, nessuno storico:
// la pagina non li legge nemmeno dal database.
export default async function SchedaAllievoPage({ params, searchParams }: Props) {
  const { userId: trainerId } = await richiediTrainer()
  const allievoId = idDaParametro((await params).allievoId)
  if (allievoId === null) notFound()
  const allievo = await allievoDelTrainer(trainerId, allievoId)
  if (!allievo) notFound()

  const richiesto = primoParametro((await searchParams).r)
  const giorni = await leggiScheda(allievoId)
  const base = `/trainer/${allievoId}`

  const intestazione = (
    <header className="space-y-1">
      <Link href="/trainer" className="inline-flex items-center gap-1 text-sm font-semibold text-accento">
        <IconaSinistra className="size-4" />I tuoi allievi
      </Link>
      <h1 className="text-3xl leading-tight font-extrabold tracking-tight">{allievo.fullName}</h1>
    </header>
  )

  if (giorni.length === 0) {
    return (
      <div className="space-y-5">
        {intestazione}
        <div className={`${stileCarta} space-y-3 p-5`}>
          <p className="text-muto">La scheda non ha ancora nessuna giornata.</p>
          <div className="w-24">
            <AggiungiGiornata utenteId={trainerId} allievoId={allievoId} modifica={`${base}/modifica`} />
          </div>
        </div>
      </div>
    )
  }

  const giorno = giorni.find((g) => g.id === richiesto) ?? giorni[0]

  return (
    <div className="space-y-5">
      {intestazione}

      <TabGiorni
        giorni={giorni}
        attivo={giorno.id}
        percorso={base}
        aggiungi={
          giorni.length < GIORNATE_MASSIME ? (
            <AggiungiGiornata utenteId={trainerId} allievoId={allievoId} modifica={`${base}/modifica`} />
          ) : undefined
        }
      />

      <header className="flex items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-muto">Allenamento {giorno.id}</p>
          <h2 className="text-2xl leading-tight font-extrabold tracking-tight">{giorno.titolo}</h2>
        </div>
        <Link href={`${base}/modifica?r=${giorno.id}`} className={`${stileBottoneChiaro} shrink-0`}>
          <IconaRegolazioni className="size-4" />
          Modifica
        </Link>
      </header>

      {giorno.esercizi.length === 0 ? (
        <p className={`${stileCarta} p-4 text-muto`}>Questa giornata non ha ancora esercizi: usa Modifica per aggiungerli.</p>
      ) : (
        <ElencoGiornata esercizi={giorno.esercizi} />
      )}

      {giorni.length > 1 && (
        <RimuoviGiornata utenteId={trainerId} allievoId={allievoId} id={giorno.id} titolo={giorno.titolo} base={base} />
      )}
    </div>
  )
}
