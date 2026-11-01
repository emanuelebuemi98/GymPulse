'use client'

import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { formatDataBreve, formatNumero } from '@/lib/formato'
import { asseBarre, asseTempo, asseY } from '@/lib/grafico'

export type PuntoSerie = {
  istante: number // posizione nel tempo in millisecondi: sulle linee i punti stanno dove cadono le date
  etichetta: string // testo breve sull'asse X delle barre (es. 28/10)
  descrizione: string // testo completo per suggerimento e tabella (es. 28 ott 2026)
  valore: number // altezza del punto o della barra
  testo: string // valore con unità, già formattato (es. 62,5 kg)
  dettaglio?: string // come si arriva al valore, nel suggerimento e nella tabella (es. 120 + 150 + 160)
  attenuato?: boolean // il dato si basa su ripetizioni da verificare: lo dicono suggerimento, tabella (*) e nota
}

type Props = {
  tipo: 'linea' | 'barre'
  punti: PuntoSerie[]
  titolo: string // nome accessibile del grafico
  colonnaEtichetta: string // intestazione della tabella alternativa
  colonnaValore: string
  interi?: boolean // l'asse mostra solo numeri interi (conteggi)
  notaAttenuati?: string // spiegazione dell'asterisco dei dati da verificare, mostrata sotto il grafico
}

// Colori del tema chiaro: la serie usa lo slot 1 della palette dei grafici (validato sulla superficie della carta,
// #fffdf7, con scripts/validate_palette.js); griglia e assi sono toni recessivi, il testo usa i colori del testo
// e non quello della serie. Stesso blu di `--color-grafico` in globals.css, che serve alle barre fatte in HTML.
const COLORI = {
  serie: '#2a78d6',
  superficie: '#fffdf7',
  griglia: '#e6dfcc',
  base: '#c3c2b7',
  asse: '#52514e',
  inchiostro: '#17150f',
  mirino: '#b9b29c',
  evidenza: 'rgba(23, 21, 15, 0.05)',
}

const MARGINI = { top: 22, right: 26, bottom: 0, left: 0 }
// Con più punti di così gli anelli dei marcatori si toccano e coprono la linea: resta solo l'ultimo.
const PUNTI_CON_MARCATORI = 12
// Larghezza di un carattere dell'asse a 12 px, con un po' di margine.
const LARGHEZZA_CARATTERE = 7

const stileAsse = { fontSize: 12, fill: COLORI.asse }

// Il suggerimento: il valore in evidenza, la data sotto. Compare al passaggio del mouse e con la tastiera.
function Suggerimento({ active, payload }: { active?: boolean; payload?: { payload?: PuntoSerie }[] }) {
  const punto = active ? payload?.[0]?.payload : undefined
  if (!punto) return null
  return (
    <div className="rounded-2xl bg-inchiostro px-3 py-2 text-su-inchiostro shadow-lg">
      <p className="font-bold">{punto.testo}</p>
      {punto.dettaglio && <p className="text-xs tabular-nums text-su-inchiostro/70">{punto.dettaglio}</p>}
      <p className="text-xs text-su-inchiostro/70">{punto.descrizione}</p>
      {punto.attenuato && <p className="text-xs text-su-inchiostro/70">Ripetizioni da verificare</p>}
    </div>
  )
}

type PropsPunto = { cx?: number; cy?: number; index?: number }
type PropsEtichetta = { x?: number | string; y?: number | string; width?: number | string; value?: unknown }

export function GraficoSerie({
  tipo,
  punti,
  titolo,
  colonnaEtichetta,
  colonnaValore,
  interi = false,
  notaAttenuati,
}: Props) {
  if (punti.length === 0) return null

  const valori = punti.map((p) => p.valore)
  const asse = tipo === 'linea' ? asseY(valori) : asseBarre(valori, 4, interi ? 1 : 0)
  const ultimo = punti.length - 1
  const haAttenuati = punti.some((p) => p.attenuato)

  // Sull'asse dei valori, da 10.000 in su, i numeri diventano "10k": una sola forma per tutto l'asse.
  const compatto = asse.max >= 10_000
  const formattaValore = (valore: number) => (compatto ? `${formatNumero(valore / 1000, 0)}k` : formatNumero(valore))
  const larghezzaAsseY = Math.max(
    28,
    Math.max(...asse.tick.map((valore) => formattaValore(valore).length)) * LARGHEZZA_CARATTERE + 12,
  )

  // Sulle barre si scrive il valore della più alta, passandolo dentro il dato: non si può contare sull'indice,
  // perché Recharts non disegna le barre a zero e quelli che restano scalano di posto.
  const indiceMassimo = valori.indexOf(Math.max(...valori))
  const datiBarre = punti.map((punto, indice) => ({
    ...punto,
    marcato: indice === indiceMassimo && punto.valore > 0 ? punto.testo : undefined,
  }))

  const tempo = tipo === 'linea' ? asseTempo(punti.map((p) => p.istante)) : null

  const asseX =
    tempo === null ? (
      <XAxis
        key="x"
        dataKey="etichetta"
        tick={stileAsse}
        tickLine={false}
        axisLine={{ stroke: COLORI.base }}
        interval="preserveStartEnd"
        minTickGap={14}
        tickMargin={6}
      />
    ) : (
      <XAxis
        key="x"
        dataKey="istante"
        type="number"
        scale="time"
        domain={tempo.dominio}
        ticks={tempo.tick}
        tickFormatter={(istante: number) => formatDataBreve(new Date(istante))}
        tick={stileAsse}
        tickLine={false}
        axisLine={{ stroke: COLORI.base }}
        tickMargin={6}
      />
    )

  const assi = [
    asseX,
    <YAxis
      key="y"
      width={larghezzaAsseY}
      tick={stileAsse}
      tickLine={false}
      axisLine={false}
      domain={[asse.min, asse.max]}
      ticks={asse.tick}
      interval={0}
      tickFormatter={formattaValore}
    />,
    <CartesianGrid key="griglia" vertical={false} stroke={COLORI.griglia} />,
  ]

  // Il marcatore è un cerchio da 8 px con l'anello del colore della carta; l'ultimo porta anche il valore.
  // Se la linea arriva dall'alto il valore va sotto il punto, altrimenti toccherebbe il tratto che scende.
  const valoreSottoUltimo = punti.length > 1 && punti[ultimo - 1].valore > punti[ultimo].valore
  const disegnaPunto = ({ cx, cy, index }: PropsPunto) => {
    if (cx === undefined || cy === undefined) return <g />
    const èUltimo = index === ultimo
    if (!èUltimo && punti.length > PUNTI_CON_MARCATORI) return <g />
    return (
      <g>
        <circle cx={cx} cy={cy} r={4} fill={COLORI.serie} stroke={COLORI.superficie} strokeWidth={2} />
        {èUltimo && (
          <text
            x={cx - 8}
            y={valoreSottoUltimo ? cy + 18 : cy - 10}
            textAnchor="end"
            fontSize={12}
            fontWeight={700}
            fill={COLORI.inchiostro}
          >
            {punti[ultimo].testo}
          </text>
        )}
      </g>
    )
  }

  // Valore sopra la barra più alta, su una riga sola: l'etichetta di Recharts va a capo quando è più larga della barra.
  const disegnaEtichettaBarra = ({ x, y, width, value }: PropsEtichetta) => {
    if (typeof value !== 'string') return <g />
    return (
      <text
        x={Number(x) + Number(width) / 2}
        y={Number(y) - 6}
        textAnchor="middle"
        fontSize={12}
        fontWeight={700}
        fill={COLORI.inchiostro}
      >
        {value}
      </text>
    )
  }

  return (
    <div className="space-y-3">
      <div role="group" aria-label={titolo} className="h-60 w-full">
        <ResponsiveContainer width="100%" height="100%">
          {tipo === 'linea' ? (
            <LineChart data={punti} margin={MARGINI}>
              {assi}
              <Tooltip
                content={<Suggerimento />}
                cursor={{ stroke: COLORI.mirino, strokeWidth: 1 }}
                isAnimationActive={false}
              />
              <Line
                type="linear"
                dataKey="valore"
                stroke={COLORI.serie}
                strokeWidth={2}
                strokeLinejoin="round"
                strokeLinecap="round"
                dot={disegnaPunto}
                activeDot={{ r: 6, fill: COLORI.serie, stroke: COLORI.superficie, strokeWidth: 2 }}
                isAnimationActive={false}
              />
            </LineChart>
          ) : (
            <BarChart data={datiBarre} margin={MARGINI}>
              {assi}
              <Tooltip
                content={<Suggerimento />}
                cursor={{ fill: COLORI.evidenza }}
                isAnimationActive={false}
              />
              <Bar dataKey="valore" fill={COLORI.serie} maxBarSize={24} radius={[4, 4, 0, 0]} isAnimationActive={false}>
                <LabelList dataKey="marcato" content={disegnaEtichettaBarra} />
              </Bar>
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>

      {haAttenuati && notaAttenuati && <p className="text-xs text-attenzione">{notaAttenuati}</p>}

      {/* La tabella è l'equivalente del grafico per chi non lo vede e per chi vuole i numeri precisi. */}
      <details className="text-sm text-muto">
        <summary className="cursor-pointer font-semibold hover:text-testo">Vedi come tabella</summary>
        <table className="mt-2 w-full tabular-nums">
          <thead className="text-left text-xs">
            <tr>
              <th className="pb-1 font-semibold">{colonnaEtichetta}</th>
              <th className="pb-1 font-semibold">{colonnaValore}</th>
            </tr>
          </thead>
          <tbody>
            {punti.map((punto, indice) => (
              <tr key={indice} className="border-t border-bordo">
                <td className="py-1.5">{punto.descrizione}</td>
                <td className="py-1.5 text-testo">
                  {punto.testo}
                  {punto.attenuato && ' *'}
                  {punto.dettaglio && <span className="ml-1.5 text-xs text-muto">({punto.dettaglio})</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </div>
  )
}
