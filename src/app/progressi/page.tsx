import type { Metadata } from 'next'
import Link from 'next/link'
import { DistribuzioneGiornate } from '@/components/DistribuzioneGiornate'
import { GraficoSerie, type PuntoSerie } from '@/components/GraficoSerie'
import { SchedeProgressi } from '@/components/SchedeProgressi'
import { SelettoreEsercizio } from '@/components/SelettoreEsercizio'
import { stileCarta } from '@/components/stili'
import { PesoPerGruppo } from '@/components/PesoPerGruppo'
import { dataIso, formatData, formatDataBreve, formatDataNumerica, formatNumero } from '@/lib/formato'
import { istanteDaIso, lunediDi, pesoPerGruppo, perGiornata, perSettimana, spostaSettimane } from '@/lib/panoramica'
import { descriviSomma } from '@/lib/progressi'
import { andamentoEsercizio, elencoSessioni, eserciziConDati, recordPerEsercizio, serieConGruppo } from '@/lib/storico'
import { idDaParametro } from '@/lib/url'
import { richiediUtente } from '@/lib/accesso'

// Legge il database a ogni richiesta: i grafici si aggiornano dopo ogni seduta.
export const dynamic = 'force-dynamic'

export const metadata: Metadata = { title: 'Progressi' }

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> }

const NOTA_DA_VERIFICARE = '* Ripetizioni non registrate: sono quelle previste dalla scheda, quindi indicative.'
const RECORD_RECENTI = 5

const sedute = (n: number) => (n === 1 ? '1 seduta' : `${n} sedute`)

export default async function ProgressiPage({ searchParams }: Props) {
  const userId = await richiediUtente()
  const { e: parametro, s: settimana } = await searchParams
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
    return <Panoramica userId={userId} primoEsercizio={esercizi[0].id} settimana={settimana} />
  }
  const scelto = esercizi.find((e) => e.id === idDaParametro(parametro)) ?? esercizi[0]
  return <PerEsercizio userId={userId} esercizi={esercizi} scelto={scelto} />
}

// La settimana da mostrare nei kg per gruppo: quella scelta con "s" (AAAA-MM-GG, anche un giorno qualunque della
// settimana), altrimenti quella in corso. Sta sempre tra la prima settimana con sedute e l'ultima.
function settimanaScelta(parametro: string | string[] | undefined, primo: string, ultimo: string, corrente: string) {
  const letto = typeof parametro === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(parametro) ? lunediDi(parametro) : corrente
  return letto < primo ? primo : letto > ultimo ? ultimo : letto
}

async function Panoramica({
  userId,
  primoEsercizio,
  settimana,
}: {
  userId: number
  primoEsercizio: number
  settimana: string | string[] | undefined
}) {
  const [elenco, record, serie] = await Promise.all([elencoSessioni(userId), recordPerEsercizio(userId), serieConGruppo(userId)])
  const settimane = perSettimana(elenco)
  const giornate = perGiornata(elenco)
  const recenti = [...record].sort((a, b) => b.data.getTime() - a.data.getTime()).slice(0, RECORD_RECENTI)

  const corrente = lunediDi(dataIso(new Date()))
  const inizi = elenco.map((s) => lunediDi(dataIso(s.data))).sort()
  const primaSettimana = inizi[0] ?? corrente
  const ultimaSettimana = inizi[inizi.length - 1] > corrente ? inizi[inizi.length - 1] : corrente
  const inizio = settimanaScelta(settimana, primaSettimana, ultimaSettimana, corrente)
  const precedente = inizio > primaSettimana ? spostaSettimane(inizio, -1) : null
  const successiva = inizio < ultimaSettimana ? spostaSettimane(inizio, 1) : null
  const { gruppi, senzaGruppo } = pesoPerGruppo(serie, inizio)
  const fineSettimana = istanteDaIso(spostaSettimane(inizio, 1)).getTime() - 86_400_000

  const puntiSedute: PuntoSerie[] = settimane.map((s) => ({
    istante: istanteDaIso(s.inizio).getTime(),
    etichetta: formatDataBreve(istanteDaIso(s.inizio)),
    descrizione: `Settimana dal ${formatData(istanteDaIso(s.inizio))}`,
    valore: s.sedute,
    testo: sedute(s.sedute),
  }))
  const stileFreccia = 'rounded-full border border-bordo bg-carta px-4 py-2 text-sm font-semibold transition active:bg-carta-alta'
  const stileFrecciaOff = 'rounded-full border border-bordo px-4 py-2 text-sm font-semibold text-muto opacity-40'

  return (
    <div className="space-y-5">
      <h1 className="text-3xl font-extrabold tracking-tight">Progressi</h1>
      <SchedeProgressi attiva="panoramica" primoEsercizio={primoEsercizio} />

      <section className={`${stileCarta} space-y-3 p-4`}>
        <div>
          <h2 className="text-lg font-extrabold">Sedute per settimana</h2>
          <p className="text-sm text-muto">Quante volte ti sei allenato, settimana per settimana</p>
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
          <h2 className="text-lg font-extrabold">Kg per gruppo muscolare</h2>
          <p className="text-sm text-muto">
            I kg di tutte le serie della settimana, sommati per gruppo. Addome, cardio e riscaldamento non hanno kg da sommare e non compaiono.
          </p>
        </div>
        <div className="flex items-center justify-between gap-2">
          {precedente ? (
            <Link href={`/progressi?s=${precedente}`} aria-label="Settimana precedente" className={stileFreccia}>
              ←
            </Link>
          ) : (
            <span aria-hidden="true" className={stileFrecciaOff}>
              ←
            </span>
          )}
          <p className="text-center text-sm font-semibold tabular-nums">
            {formatData(istanteDaIso(inizio))} – {formatData(new Date(fineSettimana))}
          </p>
          {successiva ? (
            <Link href={`/progressi?s=${successiva}`} aria-label="Settimana successiva" className={stileFreccia}>
              →
            </Link>
          ) : (
            <span aria-hidden="true" className={stileFrecciaOff}>
              →
            </span>
          )}
        </div>
        <PesoPerGruppo gruppi={gruppi} />
        {senzaGruppo > 0 && (
          <p className="text-xs text-attenzione">
            Non contati: {formatNumero(senzaGruppo)} kg di esercizi senza gruppo muscolare. Sceglilo dalla scheda.
          </p>
        )}
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

  // Il peso totale di ogni seduta: i kg di tutte le serie sommati (120 + 150 + 160 = 430), senza le ripetizioni.
  // Il suggerimento mostra come si arriva alla somma.
  const puntiPesoTotale: PuntoSerie[] = andamento
    .filter((seduta) => seduta.pesoTotaleKg > 0)
    .map((seduta) => ({
      ...comuni(seduta),
      valore: seduta.pesoTotaleKg,
      testo: `${formatNumero(seduta.pesoTotaleKg)} kg`,
      dettaglio: `${descriviSomma(seduta.serie.flatMap((s) => (s.pesoKg === null ? [] : [s.pesoKg])))} kg`,
    }))

  // Le ripetizioni di ogni seduta sommate. Nelle sedute con dati iniziali sono quelle previste dalla scheda, non quelle
  // fatte: lo dicono il suggerimento, l'asterisco nella tabella e la nota. Le barre hanno sempre lo stesso colore.
  const puntiRipetizioni: PuntoSerie[] = andamento.map((seduta) => {
    const ripetizioni = seduta.serie.map((s) => s.ripetizioni)
    const totale = ripetizioni.reduce((somma, r) => somma + r, 0)
    return {
      ...comuni(seduta),
      valore: totale,
      testo: `${totale} rip`,
      dettaglio: ripetizioni.length > 1 ? `${descriviSomma(ripetizioni)} rip` : undefined,
      attenuato: seduta.datiIniziali,
    }
  })

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
            <h2 className="text-lg font-extrabold">Peso totale per seduta</h2>
            <p className="text-sm text-muto">
              I kg di tutte le serie di questo esercizio sommati, seduta per seduta in base al numero di ripetizioni.
            </p>
          </div>
          <GraficoSerie
            tipo="barre"
            punti={puntiPesoTotale}
            titolo={`Peso totale di ${scelto.nome}`}
            colonnaEtichetta="Data"
            colonnaValore="Peso totale"
          />
        </section>
      )}

      {conCarico && (
        <section className={`${stileCarta} space-y-3 p-4`}>
          <div>
            <h2 className="text-lg font-extrabold">Ripetizioni totali per seduta</h2>
            <p className="text-sm text-muto">
              Le ripetizioni di tutte le serie di questo esercizio sommate, seduta per seduta.
            </p>
          </div>
          <GraficoSerie
            tipo="barre"
            punti={puntiRipetizioni}
            titolo={`Ripetizioni totali di ${scelto.nome}`}
            colonnaEtichetta="Data"
            colonnaValore="Ripetizioni"
            interi
            notaAttenuati={NOTA_DA_VERIFICARE}
          />
        </section>
      )}

      <p className="flex gap-2 text-sm text-muto">
        <span aria-hidden="true">ⓘ</span>
        <span>
          Ogni dato vale solo per lo stesso esercizio: i kg di macchine, cavi, manubri e bilanciere non sono
          confrontabili tra loro.
        </span>
      </p>
    </div>
  )
}
