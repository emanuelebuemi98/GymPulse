import type { Metadata } from 'next'
import Link from 'next/link'
import { stileAvviso, stileCarta, stileEtichetta } from '@/components/stili'
import { formatDataLunga, formatNumero } from '@/lib/formato'
import { elencoSessioni } from '@/lib/storico'

// Legge il database a ogni richiesta: l'elenco cambia dopo ogni seduta salvata.
export const dynamic = 'force-dynamic'

export const metadata: Metadata = { title: 'Storico' }

const giornoDelMese = new Intl.DateTimeFormat('it-IT', { timeZone: 'Europe/Rome', day: 'numeric' })
const meseBreve = new Intl.DateTimeFormat('it-IT', { timeZone: 'Europe/Rome', month: 'short' })

export default async function StoricoPage() {
  const sessioni = await elencoSessioni()

  return (
    <div className="space-y-5">
      <header className="flex items-end justify-between gap-3">
        <h1 className="text-3xl font-extrabold tracking-tight">Storico</h1>
        <p className="pb-1 text-sm font-semibold text-muto">
          {sessioni.length === 1 ? '1 seduta' : `${sessioni.length} sedute`}
        </p>
      </header>

      {sessioni.length === 0 ? (
        <p className={`${stileCarta} p-4 text-muto`}>
          Non hai ancora registrato sedute.{' '}
          <Link href="/scheda" className="font-semibold text-accento underline">
            Apri la scheda
          </Link>
        </p>
      ) : (
        <ul className="space-y-3">
          {sessioni.map((sessione) => (
            <li key={sessione.id}>
              <Link href={`/storico/${sessione.id}`} className={`${stileCarta} flex gap-4 p-3 active:bg-carta-alta`}>
                {/* La data in evidenza a sinistra: si scorre l'elenco guardando i giorni. */}
                <span
                  aria-hidden="true"
                  className="grid w-16 shrink-0 place-content-center rounded-2xl bg-carta-alta py-2 text-center"
                >
                  <span className="text-2xl leading-none font-extrabold">{giornoDelMese.format(sessione.data)}</span>
                  <span className="text-xs font-bold text-muto uppercase">{meseBreve.format(sessione.data)}</span>
                </span>
                <span className="min-w-0 flex-1 space-y-1 py-1">
                  <span className="block font-extrabold">
                    {sessione.giornoId} · {sessione.giornoTitolo}
                  </span>
                  <span className="block text-xs text-muto">{formatDataLunga(sessione.data)}</span>
                  <span className="block text-sm text-muto">
                    {sessione.numeroEsercizi} esercizi · {sessione.numeroSerie} serie
                    {sessione.volumeKg > 0 && ` · ${formatNumero(sessione.volumeKg, 0)} kg`}
                    {sessione.durataMinuti !== null && ` · ${sessione.durataMinuti} min`}
                    {sessione.kcalStimate !== null && ` · ~${sessione.kcalStimate} kcal`}
                  </span>
                  {sessione.datiIniziali && (
                    <span className="flex flex-wrap gap-2 pt-1">
                      <span className={stileEtichetta}>Dati iniziali</span>
                      <span className={stileAvviso}>Rep da verificare</span>
                    </span>
                  )}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
