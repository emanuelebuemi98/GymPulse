import type { Metadata } from 'next'
import Link from 'next/link'
import { AggiungiGiornata } from '@/components/AggiungiGiornata'
import { IconaPlay, IconaRegolazioni } from '@/components/icone'
import { RimuoviGiornata } from '@/components/RimuoviGiornata'
import { stileBottoneChiaro, stileCarta } from '@/components/stili'
import { TabGiorni } from '@/components/TabGiorni'
import { descrizioneObiettivo, descrizioneRecupero, giornoConsigliato } from '@/lib/allenamento'
import { formatNumero } from '@/lib/formato'
import { GIORNATE_MASSIME } from '@/lib/giornate'
import { massimoKg } from '@/lib/progressi'
import { contaSeduteGiornata, leggiScheda } from '@/lib/scheda-db'
import { riepilogoHome, ultimeVolte } from '@/lib/storico'
import { primoParametro } from '@/lib/url'
import { richiediUtente } from '@/lib/accesso'

// Legge il database a ogni richiesta: la scheda si può modificare e i carichi cambiano dopo ogni seduta.
export const dynamic = 'force-dynamic'

export const metadata: Metadata = { title: 'Scheda' }

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> }

export default async function SchedaPage({ searchParams }: Props) {
  const userId = await richiediUtente()
  const richiesto = primoParametro((await searchParams).r)
  const [giorni, { ultima }] = await Promise.all([leggiScheda(userId), riepilogoHome(userId)])

  if (giorni.length === 0) {
    // Non dovrebbe capitare (una scheda ha sempre almeno una giornata), ma un account creato in altri modi potrebbe.
    return (
      <div className={`${stileCarta} space-y-3 p-5`}>
        <p className="text-muto">La scheda non ha ancora nessuna giornata.</p>
        <div className="w-24">
          <AggiungiGiornata utenteId={userId} />
        </div>
      </div>
    )
  }

  const giorno = giorni.find((g) => g.id === richiesto) ?? giornoConsigliato(giorni, ultima)
  const [ultime, sedute] = await Promise.all([
    ultimeVolte(userId, giorno.esercizi.map((e) => e.id)),
    contaSeduteGiornata(userId, giorno.id),
  ])

  return (
    <div className="space-y-5">
      <TabGiorni
        giorni={giorni}
        attivo={giorno.id}
        percorso="/scheda"
        aggiungi={giorni.length < GIORNATE_MASSIME ? <AggiungiGiornata utenteId={userId} /> : undefined}
      />

      <header className="flex items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-muto">Allenamento {giorno.id}</p>
          <h1 className="text-3xl leading-tight font-extrabold tracking-tight">{giorno.titolo}</h1>
        </div>
        <Link href={`/scheda/modifica?r=${giorno.id}`} className={`${stileBottoneChiaro} shrink-0`}>
          <IconaRegolazioni className="size-4" />
          Modifica
        </Link>
      </header>

      {/* Il pulsante principale sta subito sopra l'elenco, non in fondo. */}
      <Link
        href={`/sessione?r=${giorno.id}`}
        className="flex items-center justify-center gap-2 rounded-full bg-accento px-5 py-4 text-base font-extrabold text-su-accento active:opacity-80"
      >
        <IconaPlay className="size-5" />
        Avvia sessione {giorno.id}
      </Link>

      <ol className={`${stileCarta} divide-y divide-bordo overflow-hidden`}>
        {giorno.esercizi.map((esercizio, indice) => {
          const kg = massimoKg(ultime[esercizio.id]?.serie ?? [])
          const recupero = descrizioneRecupero(esercizio.obiettivo)
          return (
            <li key={esercizio.id} className="flex items-center gap-3 px-4 py-3.5">
              <span className="w-6 shrink-0 text-sm font-bold text-muto tabular-nums">{indice + 1}</span>
              <span className="min-w-0 flex-1">
                <span className="block font-bold">{esercizio.nome}</span>
                <span className="block text-sm text-muto">
                  {descrizioneObiettivo(esercizio.obiettivo)}
                  {recupero && ` · ${recupero}`}
                </span>
              </span>
              {kg !== null && (
                <span className="shrink-0 rounded-full bg-carta-alta px-3 py-1 text-sm font-bold tabular-nums">
                  {formatNumero(kg)} kg
                </span>
              )}
            </li>
          )
        })}
      </ol>

      {giorni.length > 1 && <RimuoviGiornata utenteId={userId} id={giorno.id} titolo={giorno.titolo} sedute={sedute} />}
    </div>
  )
}
