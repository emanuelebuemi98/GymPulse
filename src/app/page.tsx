import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { GalleriaSchermate } from '@/components/benvenuto/GalleriaSchermate'
import {
  SchermataComeSiFa,
  SchermataProgressi,
  SchermataScheda,
  SchermataSessione,
} from '@/components/benvenuto/Telefono'
import {
  IconaCarica,
  IconaChevronGiu,
  IconaPlay,
  IconaScheda,
  IconaScudo,
  IconaSpunta,
  IconaStorico,
} from '@/components/icone'
import { SimboloGymPulse } from '@/components/Logo'
import { stileBottoneChiaro } from '@/components/stili'
import { haAccesso } from '@/lib/accesso'

// Legge il cookie a ogni richiesta: chi è già dentro non vede la presentazione.
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: { absolute: 'GymPulse · il diario di allenamento' },
  description:
    'Costruisci la tua scheda, registra kg e ripetizioni serie per serie, segui i tempi di recupero e guarda i progressi.',
}

const schermate = [
  {
    titolo: 'La tua scheda',
    testo: 'Da una a sette giornate, con gli esercizi scelti dal catalogo, le serie, le ripetizioni e il recupero.',
    schermata: <SchermataScheda />,
  },
  {
    titolo: 'In palestra',
    testo: 'Scrivi kg e ripetizioni e tocca la spunta. Parte il timer di recupero e vedi i valori dell\'ultima volta.',
    schermata: <SchermataSessione />,
  },
  {
    titolo: 'Come si fa',
    testo: 'Ogni esercizio ha l\'immagine, i passi dell\'esecuzione e gli errori da evitare.',
    schermata: <SchermataComeSiFa />,
  },
  {
    titolo: 'I tuoi progressi',
    testo: 'Sedute per settimana, kg per categoria e un grafico per ogni esercizio.',
    schermata: <SchermataProgressi />,
  },
]

const passi = [
  {
    titolo: 'Costruisci la scheda',
    testo:
      'Aggiungi le giornate (A, B, C…) e scegli gli esercizi da un catalogo di 246, con ricerca per nome e filtro per categoria. Per ognuno decidi serie, ripetizioni e recupero.',
  },
  {
    titolo: 'Allenati',
    testo:
      'La home ti dice cosa tocca oggi. Registri ogni serie e l\'app ti mostra i valori dell\'ultima volta, e quando hai completato tutte le ripetizioni ti propone il peso successivo.',
  },
  {
    titolo: 'Guarda come migliori',
    testo: 'Lo storico tiene ogni seduta. I grafici mostrano carico massimo, peso totale e ripetizioni nel tempo.',
  },
]

const funzioni = [
  {
    icona: IconaScheda,
    titolo: 'Catalogo di 246 esercizi',
    testo: 'In nove categorie: Petto, Dorsali, Spalle, Braccia, Gambe, Glutei, Addome, Cardio e Riscaldamento.',
  },
  {
    icona: IconaPlay,
    titolo: 'Timer di recupero',
    testo: 'Parte dopo ogni serie con il tempo previsto dalla scheda, e vibra quando è finito.',
  },
  {
    icona: IconaSpunta,
    titolo: 'Non perdi niente',
    testo: 'Se il telefono si spegne a metà allenamento, le serie confermate restano e riprendi da dove eri.',
  },
  {
    icona: IconaStorico,
    titolo: 'Giornata consigliata',
    testo: 'Segue l\'ordine delle giornate e ogni lunedì riparte dalla prima.',
  },
  {
    icona: IconaCarica,
    titolo: 'Le tue sedute in Excel',
    testo: 'Le esporti in un file CSV e le reimporti quando vuoi. Importare due volte lo stesso file non duplica niente.',
  },
  {
    icona: IconaScudo,
    titolo: 'Account personale',
    testo: 'Ognuno vede solo i propri dati. Se dimentichi la password la recuperi con un codice per email.',
  },
]

export default async function BenvenutoPage() {
  if (await haAccesso()) redirect('/home')

  return (
    <div className="space-y-14">
      {/* Prima cosa: che cos'è e come entrare. */}
      <section className="space-y-5 pt-2">
        <SimboloGymPulse className="size-14" />
        <div className="space-y-3">
          <h1 className="text-4xl leading-[1.05] font-extrabold tracking-tight text-balance">
            Scheda, serie e progressi in un solo posto.
          </h1>
          <p className="max-w-prose text-lg text-muto">
            GymPulse è il diario di allenamento per la palestra. Costruisci la tua scheda, registra kg e ripetizioni serie
            per serie e guarda come migliori settimana dopo settimana.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/registrati"
            className="inline-flex items-center justify-center rounded-full bg-accento px-6 py-3.5 font-extrabold text-su-accento transition active:opacity-80"
          >
            Crea account
          </Link>
          <Link href="/login" className={`${stileBottoneChiaro} !px-6 !py-3.5 !text-base !font-bold`}>
            Accedi
          </Link>
        </div>
      </section>

      {/* Le schermate dell'app: quattro schede piccole, da toccare per vederle a grandezza intera. */}
      <section aria-labelledby="titolo-schermate" className="space-y-4">
        <div className="space-y-1">
          <h2 id="titolo-schermate" className="text-2xl font-extrabold tracking-tight">
            Dentro l&apos;app
          </h2>
          <p className="text-muto">Tocca una scheda per vederla a grandezza intera.</p>
        </div>
        <GalleriaSchermate voci={schermate} />
        <p className="text-xs text-muto">Le schermate sono un esempio, con dati di prova.</p>
      </section>

      {/* Come si usa: un percorso vero, in ordine. */}
      <section aria-labelledby="titolo-passi" className="space-y-4">
        <h2 id="titolo-passi" className="text-2xl font-extrabold tracking-tight">
          Come funziona
        </h2>
        <ol className="space-y-5">
          {passi.map((passo, i) => (
            <li key={passo.titolo} className="flex gap-4">
              <span
                aria-hidden="true"
                className="grid size-9 shrink-0 place-items-center rounded-full bg-inchiostro font-extrabold text-accento-chiaro tabular-nums"
              >
                {i + 1}
              </span>
              <div className="min-w-0 space-y-1">
                <h3 className="text-lg font-extrabold">{passo.titolo}</h3>
                <p className="text-muto">{passo.testo}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="titolo-funzioni" className="space-y-4">
        <h2 id="titolo-funzioni" className="text-2xl font-extrabold tracking-tight">
          Tutto quello che fa
        </h2>
        <p className="text-muto">Tocca una voce per leggere come funziona.</p>
        {/* Ogni voce è un <details>: si apre e si chiude con un tocco, da sola, anche da tastiera. Le voci sono indipendenti,
            quindi se ne possono tenere aperte più d'una. items-start: aprirne una non allunga quella accanto. */}
        <ul className="grid items-start gap-3 sm:grid-cols-2">
          {funzioni.map(({ icona: Icona, titolo, testo }) => (
            <li key={titolo}>
              <details className="group rounded-2xl border border-bordo bg-carta">
                <summary className="flex cursor-pointer list-none items-center gap-3 rounded-2xl p-3 select-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accento [&::-webkit-details-marker]:hidden">
                  <span aria-hidden="true" className="grid size-10 shrink-0 place-items-center rounded-xl bg-carta-alta text-accento">
                    <Icona className="size-5" />
                  </span>
                  <span className="min-w-0 flex-1 font-extrabold">{titolo}</span>
                  <IconaChevronGiu className="size-5 shrink-0 text-muto transition-transform group-open:rotate-180 motion-reduce:transition-none" />
                </summary>
                <p className="px-3 pb-3 pl-[4.25rem] text-sm text-muto">{testo}</p>
              </details>
            </li>
          ))}
        </ul>
        <p className="text-sm text-muto">
          Chiaro o scuro, come preferisci: il pulsante con il sole e la luna in alto a destra cambia il tema.
        </p>
      </section>

      <section className="space-y-4 rounded-3xl bg-inchiostro p-6 text-su-inchiostro">
        <h2 className="text-2xl font-extrabold tracking-tight">Pronto per la prima seduta?</h2>
        <p className="text-su-inchiostro/80">Ti servono un nome utente, un indirizzo Gmail per il recupero della password e un minuto.</p>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/registrati"
            className="inline-flex items-center justify-center rounded-full bg-accento-chiaro px-6 py-3.5 font-extrabold text-inchiostro transition active:opacity-80"
          >
            Crea account
          </Link>
          <Link href="/login" className="inline-flex items-center px-3 py-3.5 font-bold underline underline-offset-4">
            Ho già un account
          </Link>
        </div>
      </section>
    </div>
  )
}
