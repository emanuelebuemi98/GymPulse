import type { Metadata } from 'next'
import Link from 'next/link'
import { FormSessione } from '@/components/FormSessione'
import { stileCarta } from '@/components/stili'
import { giornoConsigliato } from '@/lib/allenamento'
import { dataIso } from '@/lib/formato'
import { leggiElenco, leggiScheda } from '@/lib/scheda-db'
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
  const [giorni, elenco, { ultima, fatteSettimana }] = await Promise.all([
    leggiScheda(userId),
    leggiElenco(userId),
    riepilogoHome(userId),
  ])

  if (giorni.length === 0) {
    return (
      <p className={`${stileCarta} p-5 text-muto`}>
        La scheda non ha giornate: non c&apos;è nessuna sessione da avviare.{' '}
        <Link href="/scheda" className="font-semibold text-accento underline">
          Vai alla scheda
        </Link>
      </p>
    )
  }

  const giorno = giorni.find((g) => g.id === richiesto) ?? giornoConsigliato(giorni, ultima, fatteSettimana)
  // Le ultime volte servono solo per gli esercizi che la persona ha già (quelli del catalogo non ancora suoi non hanno storia).
  const ultime = await ultimeVolte(userId, elenco.flatMap((voce) => (voce.id === null ? [] : [voce.id])))

  // `key` fa ripartire il form (e la sua bozza) quando si cambia giornata.
  return (
    <FormSessione
      key={giorno.id}
      utenteId={userId}
      giorno={giorno}
      ultime={ultime}
      elenco={elenco}
      oggi={dataIso(new Date())}
    />
  )
}
