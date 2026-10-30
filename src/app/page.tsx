import Link from 'next/link'
import { BackupDati } from '@/components/BackupDati'
import { IconaPlay } from '@/components/icone'
import { stileCarta, stileEtichetta } from '@/components/stili'
import { giornoConsigliato } from '@/lib/allenamento'
import { formatDataLunga } from '@/lib/formato'
import { leggiScheda } from '@/lib/scheda-db'
import { riepilogoHome } from '@/lib/storico'
import { richiediUtente } from '@/lib/accesso'

// Legge il database a ogni richiesta: il giorno consigliato cambia dopo ogni seduta.
export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const userId = await richiediUtente()
  const [giorni, { totale, ultima }] = await Promise.all([leggiScheda(userId), riepilogoHome(userId)])

  if (giorni.length === 0) {
    return (
      <div className={`${stileCarta} space-y-2 p-5`}>
        <h1 className="text-2xl font-extrabold">Scheda vuota</h1>
        <p className="text-muto">
          Il database non contiene ancora la scheda. Esegui <code className="text-testo">npm run db:seed</code> e
          ricarica la pagina.
        </p>
      </div>
    )
  }

  const consigliato = giornoConsigliato(giorni, ultima?.giornoId ?? null)

  return (
    <div className="space-y-7">
      {/* Prima cosa: cosa fare oggi. */}
      <section className="relative overflow-hidden rounded-3xl bg-inchiostro p-6 text-su-inchiostro">
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -top-4 -right-2 text-[9rem] leading-none font-extrabold text-accento-chiaro/20"
        >
          {consigliato.id}
        </span>
        <p className="text-sm font-semibold text-su-inchiostro/70">Oggi tocca a</p>
        <h1 className="mt-1 max-w-[16rem] text-3xl leading-tight font-extrabold tracking-tight">
          {consigliato.titolo}
        </h1>
        <p className="mt-1 text-sm text-su-inchiostro/70">
          Allenamento {consigliato.id} · {consigliato.esercizi.length} esercizi
        </p>
        <div className="relative mt-5 flex flex-wrap items-center gap-3">
          <Link
            href={`/sessione?r=${consigliato.id}`}
            className="inline-flex items-center gap-2 rounded-full bg-accento-chiaro px-5 py-3 font-extrabold text-inchiostro active:opacity-80"
          >
            <IconaPlay className="size-4" />
            Inizia
          </Link>
          <Link href={`/scheda?r=${consigliato.id}`} className="px-1 py-3 text-sm font-semibold text-su-inchiostro underline underline-offset-4">
            Vedi la scheda
          </Link>
        </div>
      </section>

      {/* Numeri e ultima seduta in una riga sola. */}
      <section aria-label="Riepilogo" className="flex items-stretch gap-3">
        <div className={`${stileCarta} w-28 shrink-0 p-4`}>
          <p className="text-4xl leading-none font-extrabold text-accento">{totale}</p>
          <p className="mt-1 text-xs font-semibold text-muto">{totale === 1 ? 'seduta registrata' : 'sedute registrate'}</p>
        </div>
        {ultima ? (
          <Link href={`/storico/${ultima.id}`} className={`${stileCarta} min-w-0 flex-1 space-y-1 p-4 active:bg-carta-alta`}>
            <p className="text-xs font-semibold text-muto">Ultima seduta</p>
            <p className="truncate font-extrabold">{formatDataLunga(ultima.data)}</p>
            <p className="truncate text-sm text-muto">
              {ultima.giornoId} · {ultima.giornoTitolo}
            </p>
            {ultima.datiIniziali && <span className={stileEtichetta}>Dati iniziali</span>}
          </Link>
        ) : (
          <div className={`${stileCarta} flex-1 p-4 text-sm text-muto`}>Nessuna seduta ancora: inizia dal pulsante qui sopra.</div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-extrabold">Le tue giornate</h2>
        <ul className="space-y-2">
          {giorni.map((giorno) => {
            const èConsigliato = giorno.id === consigliato.id
            return (
              <li key={giorno.id}>
                <Link
                  href={`/scheda?r=${giorno.id}`}
                  className={`${stileCarta} flex items-center gap-3 overflow-hidden py-3 pr-4 pl-0 active:bg-carta-alta`}
                >
                  <span
                    aria-hidden="true"
                    className={`h-12 w-1.5 shrink-0 rounded-r-full ${èConsigliato ? 'bg-accento' : 'bg-bordo'}`}
                  />
                  <span className="w-6 shrink-0 text-center text-xl font-extrabold">{giorno.id}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-bold">{giorno.titolo}</span>
                    <span className="block text-xs text-muto">
                      {giorno.esercizi.length} esercizi{èConsigliato && ' · consigliata'}
                    </span>
                  </span>
                  <span aria-hidden="true" className="text-muto">
                    ›
                  </span>
                </Link>
              </li>
            )
          })}
        </ul>
      </section>

      <BackupDati />
    </div>
  )
}
