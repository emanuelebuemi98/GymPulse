import type { Metadata } from 'next'
import Link from 'next/link'
import { DistribuzioneGiornate } from '@/components/DistribuzioneGiornate'
import { GraficoSerie, type PuntoSerie } from '@/components/GraficoSerie'
import { SchedeProgressi } from '@/components/SchedeProgressi'
import { SelettoreEsercizio } from '@/components/SelettoreEsercizio'
import { stileCarta } from '@/components/stili'
import { formatData, formatDataBreve, formatDataNumerica, formatNumero } from '@/lib/formato'
import { istanteDaIso, perGiornata, perSettimana } from '@/lib/panoramica'
import { miglioreRM } from '@/lib/progressi'
import { andamentoEsercizio, elencoSessioni, eserciziConDati, recordPerEsercizio } from '@/lib/storico'
import { idDaParametro } from '@/lib/url'
import { richiediUtente } from '@/lib/accesso'

// Legge il database a ogni richiesta: i grafici si aggiornano dopo ogni seduta.
export const dynamic = 'force-dynamic'

export const metadata: Metadata = { title: 'Progressi' }

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> }

const NOTA_DA_VERIFICARE = '* Barre chiare: basate su ripetizioni non registrate, quindi indicative.'
const RECORD_RECENTI = 5

const sedute = (n: number) => (n === 1 ? '1 seduta' : `${n} sedute`)

export default async function ProgressiPage({ searchParams }: Props) {
  const userId = await richiediUtente()
  const parametro = (await searchParams).e
  const esercizi = await eserciziConDati(userId)

  if (esercizi.length === 0) {
    return (
      <div className="space-y-5">
        <h1 className="text-3xl font-extrabold tracking-tight">Progressi</h1>
        <p className={`${stileCarta} p-4 text-muto`}>Registra almeno una seduta per vedere i grafici.</p>
      </div>
    )
  }

  // Senza "e" nell'indirizzo si vede la panoramica; con "e" l'andamento di un esercizio.
  if (parametro === undefined) {
    return <Panoramica userId={userId} primoEsercizio={esercizi[0].id} />
  }
  const scelto = esercizi.find((e) => e.id === idDaParametro(parametro)) ?? esercizi[0]
  return <PerEsercizio userId={userId} esercizi={esercizi} scelto={scelto} />
}

async function Panoramica({ userId, primoEsercizio }: { userId: number; primoEsercizio: number }) {
  const [elenco, record] = await Promise.all([elencoSessioni(userId), recordPerEsercizio(userId)])
  const settimane = perSettimana(elenco)
  const giornate = perGiornata(elenco)
  const recenti = [...record].sort((a, b) => b.data.getTime() - a.data.getTime()).slice(0, RECORD_RECENTI)

  const puntiSedute: PuntoSerie[] = settimane.map((s) => ({
    istante: istanteDaIso(s.inizio).getTime(),
    etichetta: formatDataBreve(istanteDaIso(s.inizio)),
    descrizione: `Settimana dal ${formatData(istanteDaIso(s.inizio))}`,
    valore: s.sedute,
    testo: sedute(s.sedute),
  }))
  const puntiVolume: PuntoSerie[] = settimane.map((s) => ({
    istante: istanteDaIso(s.inizio).getTime(),
    etichetta: formatDataBreve(istanteDaIso(s.inizio)),
    descrizione: `Settimana dal ${formatData(istanteDaIso(s.inizio))}`,
    valore: s.volumeKg,
    testo: `${formatNumero(s.volumeKg, 0)} kg`,
    attenuato: s.daVerificare,
  }))

  return (
    <div className="space-y-5">
      <h1 className="text-3xl font-extrabold tracking-tight">Progressi</h1>
      <SchedeProgressi attiva="panoramica" primoEsercizio={primoEsercizio} />

      <section className={`${stileCarta} space-y-3 p-4`}>
        <div>
          <h2 className="text-lg font-extrabold">Sedute per settimana</h2>
          <p className="text-sm text-muto">Quante volte ti sei allenato, settimana per settimana (da lunedì).</p>
        </div>
        <GraficoSerie
          tipo="barre"
          punti={puntiSedute}
          titolo="Sedute per settimana"
          colonnaEtichetta="Settimana"
          colonnaValore="Sedute"
          interi
        />
      </section>

      <section className={`${stileCarta} space-y-3 p-4`}>
        <div>
          <h2 className="text-lg font-extrabold">Volume per settimana</h2>
          <p className="text-sm text-muto">Kg × ripetizioni di tutte le sedute della settimana.</p>
        </div>
        <GraficoSerie
          tipo="barre"
          punti={puntiVolume}
          titolo="Volume per settimana"
          colonnaEtichetta="Settimana"
          colonnaValore="Volume"
          notaAttenuati={NOTA_DA_VERIFICARE}
        />
      </section>

      <section className={`${stileCarta} space-y-3 p-4`}>
        <div>
          <h2 className="text-lg font-extrabold">Sedute per giornata</h2>
          <p className="text-sm text-muto">Come si dividono le sedute tra le giornate della scheda.</p>
        </div>
        <DistribuzioneGiornate giornate={giornate} />
      </section>

      <section className={`${stileCarta} space-y-2 p-4`}>
        <h2 className="text-lg font-extrabold">Record recenti</h2>
        {record.length === 0 ? (
          <p className="text-sm text-muto">Nessun record: servono serie con un peso.</p>
        ) : (
          <>
            <ul className="divide-y divide-bordo">
              {recenti.map((voce) => (
                <li key={voce.esercizioId} className="flex items-baseline justify-between gap-3 py-2">
                  <Link href={`/progressi?e=${voce.esercizioId}`} className="min-w-0 font-semibold">
                    {voce.nome}
                  </Link>
                  <span className="shrink-0 tabular-nums">
                    <span className="font-extrabold text-accento">{formatNumero(voce.pesoKg)} kg</span>{' '}
                    <span className="text-sm text-muto">{formatDataNumerica(voce.data)}</span>
                  </span>
                </li>
              ))}
            </ul>
            {record.length > recenti.length && (
              <details className="text-sm text-muto">
                <summary className="cursor-pointer font-semibold hover:text-testo">
                  Tutti i record ({record.length})
                </summary>
                <ul className="mt-2 divide-y divide-bordo">
                  {record.map((voce) => (
                    <li key={voce.esercizioId} className="flex items-baseline justify-between gap-3 py-2">
                      <span className="min-w-0 font-semibold text-testo">{voce.nome}</span>
                      <span className="shrink-0 tabular-nums">
                        <span className="font-extrabold text-testo">{formatNumero(voce.pesoKg)} kg</span>{' '}
                        <span>{formatDataNumerica(voce.data)}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              </details>
            )}
          </>
        )}
      </section>
    </div>
  )
}

async function PerEsercizio({
  userId,
  esercizi,
  scelto,
}: {
  userId: number
  esercizi: { id: number; nome: string }[]
  scelto: { id: number; nome: string }
}) {
  const andamento = await andamentoEsercizio(userId, scelto.id)
  const conCarico = andamento.some((s) => s.massimoKg !== null)
  const daVerificare = andamento.some((s) => s.datiIniziali)

  const comuni = (seduta: (typeof andamento)[number]) => ({
    istante: seduta.data.getTime(),
    etichetta: formatDataBreve(seduta.data),
    descrizione: formatData(seduta.data),
  })

  // Con i pesi si segue il carico massimo di ogni seduta; a corpo libero, le ripetizioni totali.
  const puntiPrincipale: PuntoSerie[] = andamento.flatMap((seduta) => {
    if (conCarico) {
      if (seduta.massimoKg === null) return []
      return [{ ...comuni(seduta), valore: seduta.massimoKg, testo: `${formatNumero(seduta.massimoKg)} kg` }]
    }
    const ripetizioni = seduta.serie.reduce((totale, s) => totale + s.ripetizioni, 0)
    return [{ ...comuni(seduta), valore: ripetizioni, testo: `${ripetizioni} rip` }]
  })

  // Il massimale stimato parte dalle ripetizioni: nelle sedute con dati iniziali non sono state registrate, quindi non conta.
  const puntiMassimale: PuntoSerie[] = andamento.flatMap((seduta) => {
    if (seduta.datiIniziali) return []
    const rm = miglioreRM(seduta.serie)
    return rm === null ? [] : [{ ...comuni(seduta), valore: rm, testo: `${formatNumero(rm)} kg` }]
  })

  const puntiVolume: PuntoSerie[] = andamento
    .filter((seduta) => seduta.volumeKg > 0)
    .map((seduta) => ({
      ...comuni(seduta),
      valore: seduta.volumeKg,
      testo: `${formatNumero(seduta.volumeKg, 0)} kg`,
      attenuato: seduta.datiIniziali,
    }))

  const rm = puntiMassimale.length > 0 ? Math.max(...puntiMassimale.map((p) => p.valore)) : null

  return (
    <div className="space-y-5">
      <h1 className="text-3xl font-extrabold tracking-tight">Progressi</h1>
      <SchedeProgressi attiva="esercizio" primoEsercizio={scelto.id} />
      <SelettoreEsercizio esercizi={esercizi} scelto={scelto.id} />

      <section className={`${stileCarta} space-y-3 p-4`}>
        <div>
          <h2 className="text-lg font-extrabold">{conCarico ? 'Carico massimo' : 'Ripetizioni totali'}</h2>
          <p className="text-sm text-muto">
            {conCarico
              ? 'Kg più alto tra le serie di questo esercizio, seduta per seduta.'
              : 'Somma delle ripetizioni di questo esercizio, seduta per seduta.'}
          </p>
        </div>
        <GraficoSerie
          tipo="linea"
          punti={puntiPrincipale}
          titolo={`Andamento di ${scelto.nome}`}
          colonnaEtichetta="Data"
          colonnaValore={conCarico ? 'Carico massimo' : 'Ripetizioni'}
        />
      </section>

      {conCarico && (
        <section className={`${stileCarta} space-y-3 p-4`}>
          <div>
            <h2 className="text-lg font-extrabold">Massimale stimato</h2>
            <p className="text-sm text-muto">
              Il peso che potresti sollevare una volta sola, stimato dalla serie migliore di ogni seduta.
            </p>
          </div>
          {puntiMassimale.length === 0 ? (
            <p className="text-sm text-muto">
              Servono sedute con ripetizioni registrate: nelle sedute con dati iniziali non lo sono.
            </p>
          ) : (
            <GraficoSerie
              tipo="linea"
              punti={puntiMassimale}
              titolo={`Massimale stimato di ${scelto.nome}`}
              colonnaEtichetta="Data"
              colonnaValore="Massimale stimato"
            />
          )}
        </section>
      )}

      {conCarico && (
        <section className={`${stileCarta} space-y-3 p-4`}>
          <div>
            <h2 className="text-lg font-extrabold">Volume per seduta</h2>
            <p className="text-sm text-muto">Kg × ripetizioni di questo esercizio, seduta per seduta.</p>
          </div>
          <GraficoSerie
            tipo="barre"
            punti={puntiVolume}
            titolo={`Volume di ${scelto.nome}`}
            colonnaEtichetta="Data"
            colonnaValore="Volume"
            notaAttenuati={NOTA_DA_VERIFICARE}
          />
        </section>
      )}

      <p className="flex gap-2 text-sm text-muto">
        <span aria-hidden="true">ⓘ</span>
        <span>
          Ogni dato vale solo per lo stesso esercizio: i kg di macchine, cavi, manubri e bilanciere non sono
          confrontabili tra loro. Il volume è solo indicativo
          {rm !== null && `, e il massimale stimato (al massimo ${formatNumero(rm)} kg, formula di Epley) non è una misura diretta`}
          {daVerificare && '. Alcune sedute hanno ripetizioni non registrate'}.
        </span>
      </p>
    </div>
  )
}
