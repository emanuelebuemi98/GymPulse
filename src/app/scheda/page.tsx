import type { Metadata } from 'next'
import Link from 'next/link'
import { AggiungiGiornata } from '@/components/AggiungiGiornata'
import { CsvScheda } from '@/components/CsvScheda'
import { IconaPlay, IconaRegolazioni } from '@/components/icone'
import { ElencoGiornata } from '@/components/ElencoGiornata'
import { ModificataDa } from '@/components/ModificataDa'
import { RimuoviGiornata } from '@/components/RimuoviGiornata'
import { stileBottoneChiaro, stileCarta, stileEtichetta } from '@/components/stili'
import { TabGiorni } from '@/components/TabGiorni'
import { giornoConsigliato, riepilogoGiornata } from '@/lib/allenamento'
import { categoriaDa, etichettaCategoria } from '@/lib/categorie'
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
  const riepilogo = riepilogoGiornata(giorno.esercizi)
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

      <ModificataDa modificata={giorno.modificata} />

      {/* Cosa c'è dentro la giornata, prima dell'elenco: quanti esercizi e serie, quanto può durare e cosa si allena. */}
      <section aria-label="Riepilogo della giornata" className="space-y-2">
        <div className="grid grid-cols-3 gap-2">
          <DatoGiornata valore={String(riepilogo.esercizi)} etichetta={riepilogo.esercizi === 1 ? 'esercizio' : 'esercizi'} />
          <DatoGiornata valore={String(riepilogo.serie)} etichetta="serie" />
          <DatoGiornata valore={riepilogo.minutiStimati === null ? '—' : `~${riepilogo.minutiStimati}`} etichetta="minuti circa" />
        </div>
        {riepilogo.categorie.length > 0 && (
          <ul aria-label="Categorie allenate" className="flex flex-wrap gap-1.5">
            {riepilogo.categorie.map((categoria) => (
              <li key={categoria} className={stileEtichetta}>
                {categoriaDa(categoria) ? etichettaCategoria(categoriaDa(categoria)!) : categoria}
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Il pulsante principale sta subito sopra l'elenco, non in fondo. */}
      <Link
        href={`/sessione?r=${giorno.id}`}
        className="flex items-center justify-center gap-2 rounded-full bg-accento px-5 py-4 text-base font-extrabold text-su-accento active:opacity-80"
      >
        <IconaPlay className="size-5" />
        Avvia sessione {giorno.id}
      </Link>

      <ElencoGiornata
        esercizi={giorno.esercizi}
        kg={Object.fromEntries(giorno.esercizi.map((e) => [e.id, massimoKg(ultime[e.id]?.serie ?? [])]))}
      />

      {giorni.length > 1 && <RimuoviGiornata utenteId={userId} id={giorno.id} titolo={giorno.titolo} sedute={sedute} />}

      {/* Il catalogo intero per categoria e la scheda da un file CSV: stanno in fondo, sono usi meno frequenti. */}
      <Link
        href="/catalogo"
        className={`${stileCarta} flex items-center justify-between gap-3 px-4 py-3.5 active:bg-carta-alta`}
      >
        <span>
          <span className="block font-extrabold">Catalogo degli esercizi</span>
          <span className="block text-sm text-muto">Tutti gli esercizi per categoria, con foto e istruzioni</span>
        </span>
        <span aria-hidden="true" className="text-muto">
          ›
        </span>
      </Link>

      <CsvScheda utenteId={userId} />
    </div>
  )
}

// Un numero con la sua etichetta, nella riga sopra l'elenco degli esercizi.
function DatoGiornata({ valore, etichetta }: { valore: string; etichetta: string }) {
  return (
    <div className={`${stileCarta} px-3 py-2.5 text-center`}>
      <p className="text-2xl leading-none font-extrabold tabular-nums">{valore}</p>
      <p className="mt-1 text-xs font-semibold text-muto">{etichetta}</p>
    </div>
  )
}
