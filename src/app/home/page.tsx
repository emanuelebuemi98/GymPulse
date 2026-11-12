import Link from 'next/link'
import { CardOggi, type GiornataCard } from '@/components/CardOggi'
import { SessioneInCorso } from '@/components/SessioneInCorso'
import { stileCarta, stileEtichetta } from '@/components/stili'
import { giornoConsigliato } from '@/lib/allenamento'
import { formatDataLunga } from '@/lib/formato'
import { leggiScheda } from '@/lib/scheda-db'
import { riepilogoHome } from '@/lib/storico'
import { richiediUtente } from '@/lib/accesso'
import { leggiAllievi } from '@/lib/trainer-db'
import { leggiUtente } from '@/lib/utente'

// Legge il database a ogni richiesta: il giorno consigliato cambia dopo ogni seduta.
export const dynamic = 'force-dynamic'

// Quante miniature degli esercizi di oggi mostra la card; per gli altri c'è il "+3".
const ANTEPRIME_IN_HOME = 5

export default async function HomePage() {
  const userId = await richiediUtente()
  const [giorni, { totale, ultima, fatteSettimana }, utente] = await Promise.all([
    leggiScheda(userId),
    riepilogoHome(userId),
    leggiUtente(userId),
  ])
  // Solo per il personal trainer: quanti utenti della sua palestra hanno scelto di condividere la scheda.
  const allievi = utente?.ruolo === 'trainer' && utente.palestra ? await leggiAllievi(utente.palestra) : null

  if (giorni.length === 0) {
    return (
      <div className={`${stileCarta} space-y-2 p-5`}>
        <h1 className="text-2xl font-extrabold">Scheda vuota</h1>
        <p className="text-muto">
          La scheda non ha ancora nessuna giornata.{' '}
          <Link href="/scheda" className="font-semibold text-accento underline">
            Creane una
          </Link>
        </p>
      </div>
    )
  }

  const consigliato = giornoConsigliato(giorni, ultima, fatteSettimana)
  // Per la card: ogni giornata con le miniature dei suoi esercizi (solo quelli con un'immagine, gli altri si contano), così
  // cambiando giornata la card si aggiorna senza richiedere niente al server.
  const giornate: GiornataCard[] = giorni.map((giorno) => {
    const anteprime = giorno.esercizi
      .filter((esercizio) => esercizio.immagine !== '')
      .slice(0, ANTEPRIME_IN_HOME)
      .map((esercizio) => ({ id: esercizio.id, immagine: esercizio.immagine, nome: esercizio.nome }))
    return {
      id: giorno.id,
      titolo: giorno.titolo,
      esercizi: giorno.esercizi.length,
      anteprime,
      inPiu: giorno.esercizi.length - anteprime.length,
    }
  })
  const fatte = new Set(fatteSettimana)

  return (
    <div className="space-y-7">
      {/* Se c'è una sessione lasciata a metà (anche dopo aver chiuso il browser), si riprende da qui. */}
      <SessioneInCorso utenteId={userId} giorni={giorni.map((giorno) => ({ id: giorno.id, titolo: giorno.titolo }))} />

      {/* Per un personal trainer: gli allievi della sua palestra, la prima cosa per cui usa l'app. */}
      {allievi && (
        <Link
          href="/trainer"
          className={`${stileCarta} flex items-center justify-between gap-3 px-4 py-4 active:bg-carta-alta`}
        >
          <span>
            <span className="block text-lg font-extrabold">I tuoi allievi</span>
            <span className="block text-sm text-muto">
              {allievi.length === 0
                ? 'Nessun utente ha ancora scelto la tua palestra'
                : allievi.length === 1
                  ? '1 utente ha scelto la tua palestra'
                  : `${allievi.length} utenti hanno scelto la tua palestra`}
            </span>
          </span>
          <span aria-hidden="true" className="text-muto">
            ›
          </span>
        </Link>
      )}

      {/* Prima cosa: cosa fare oggi. Col pulsante «Cambia» si sceglie un'altra giornata. */}
      <CardOggi giornate={giornate} consigliata={consigliato.id} fatte={[...fatte]} />

      {/* Numeri e ultima seduta in una riga sola. */}
      <section aria-label="Riepilogo" className="flex items-stretch gap-3">
        <div className={`${stileCarta} w-28 shrink-0 p-4`}>
          <p className="text-4xl leading-none font-extrabold text-accento">{totale}</p>
          <p className="mt-1 text-xs font-semibold text-muto">{totale === 1 ? 'seduta registrata' : 'sedute registrate'}</p>
        </div>
        {ultima ? (
          <Link href={`/storico/${ultima.id}`} className={`${stileCarta} min-w-0 flex-1 space-y-1 p-4 active:bg-carta-alta`}>
            <p className="text-xs font-semibold text-muto">Ultima seduta</p>
            <p className="font-extrabold">{formatDataLunga(ultima.data)}</p>
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
                      {fatte.has(giorno.id) && ' · fatta'}
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
    </div>
  )
}
