'use client'

import { useEffect, useRef, useState, type PointerEvent } from 'react'
import { formatNumero } from '@/lib/formato'
import { asseY, indiceVicino, indiciEtichette, posizione } from '@/lib/grafico'

export type PuntoGrafico = {
  x: number // istante in millisecondi: posiziona il punto sull'asse X
  y: number // valore sull'asse Y
  data: string // etichetta della data, già formattata sul server
  valore: string // valore con unità, già formattato sul server
}

type Props = {
  punti: PuntoGrafico[]
  titolo: string
}

// Colori del tema scuro della palette dei grafici: slot 1 categorico per la serie unica,
// superficie della card, griglia un passo più scura del fondo, testo muto per gli assi.
const COLORI = {
  serie: '#3987e5',
  superficie: '#0f172a',
  griglia: '#1e293b',
  asse: '#94a3b8',
  mirino: '#475569',
  inchiostro: '#f1f5f9',
}

const ALTEZZA = 240
const MARGINI = { sinistra: 48, destra: 16, sopra: 16, sotto: 28 }
const LARGHEZZA_MINIMA = 280
// Stima della larghezza di un'etichetta di data a 12 px, con un po' di margine.
const LARGHEZZA_CARATTERE_X = 6.5

export function GraficoAndamento({ punti, titolo }: Props) {
  const contenitore = useRef<HTMLDivElement>(null)
  const [larghezza, setLarghezza] = useState(640)
  const [attivo, setAttivo] = useState<number | null>(null)

  // Il grafico occupa tutta la larghezza disponibile, così testo e marcatori hanno sempre la stessa dimensione.
  useEffect(() => {
    const elemento = contenitore.current
    if (!elemento) return
    const misura = () => setLarghezza(Math.max(LARGHEZZA_MINIMA, elemento.clientWidth))
    misura()
    const osservatore = new ResizeObserver(misura)
    osservatore.observe(elemento)
    return () => osservatore.disconnect()
  }, [])

  if (punti.length === 0) return null

  const area = {
    x0: MARGINI.sinistra,
    x1: larghezza - MARGINI.destra,
    y0: ALTEZZA - MARGINI.sotto,
    y1: MARGINI.sopra,
  }
  const asse = asseY(punti.map((p) => p.y))
  const xMin = Math.min(...punti.map((p) => p.x))
  const xMax = Math.max(...punti.map((p) => p.x))
  const coordinate = punti.map((p) => ({
    x: posizione(p.x, xMin, xMax, area.x0, area.x1),
    y: posizione(p.y, asse.min, asse.max, area.y0, area.y1),
  }))
  const percorso = coordinate
    .map((c, i) => `${i === 0 ? 'M' : 'L'}${c.x.toFixed(1)} ${c.y.toFixed(1)}`)
    .join(' ')
  const ultimo = coordinate[coordinate.length - 1]
  const indiciX = indiciEtichette(
    coordinate.map((c) => c.x),
    punti.map((p) => p.data.length * LARGHEZZA_CARATTERE_X),
  )

  function ancoraggioX(indice: number): 'start' | 'middle' | 'end' {
    if (punti.length === 1) return 'middle'
    if (indice === 0) return 'start'
    if (indice === punti.length - 1) return 'end'
    return 'middle'
  }

  function alMuoversi(evento: PointerEvent<SVGSVGElement>) {
    const rettangolo = evento.currentTarget.getBoundingClientRect()
    const x = ((evento.clientX - rettangolo.left) * larghezza) / rettangolo.width
    setAttivo(indiceVicino(x, coordinate.map((c) => c.x)))
  }

  // Il suggerimento resta dentro la card anche quando il punto è vicino al bordo.
  const sinistraSuggerimento =
    attivo === null ? 0 : Math.min(Math.max(coordinate[attivo].x, 64), larghezza - 64)

  return (
    <div ref={contenitore} className="relative w-full">
      <svg
        role="group"
        aria-label={titolo}
        width={larghezza}
        height={ALTEZZA}
        className="block max-w-full"
        onPointerMove={alMuoversi}
        onPointerLeave={() => setAttivo(null)}
      >
        {asse.tick.map((valore) => {
          const y = posizione(valore, asse.min, asse.max, area.y0, area.y1)
          return (
            <g key={valore}>
              <line x1={area.x0} x2={area.x1} y1={y} y2={y} stroke={COLORI.griglia} strokeWidth={1} />
              <text x={area.x0 - 8} y={y + 4} textAnchor="end" fontSize={12} fill={COLORI.asse}>
                {formatNumero(valore)}
              </text>
            </g>
          )
        })}

        {attivo !== null && (
          <line
            x1={coordinate[attivo].x}
            x2={coordinate[attivo].x}
            y1={area.y1}
            y2={area.y0}
            stroke={COLORI.mirino}
            strokeWidth={1}
          />
        )}

        {punti.length > 1 && (
          <path
            d={percorso}
            fill="none"
            stroke={COLORI.serie}
            strokeWidth={2}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        )}

        {coordinate.map((c, i) => (
          <circle
            key={i}
            cx={c.x}
            cy={c.y}
            r={attivo === i ? 6 : 4}
            fill={COLORI.serie}
            stroke={COLORI.superficie}
            strokeWidth={2}
          />
        ))}

        {/* Aree di contatto da 24 px: il tasto Tab raggiunge ogni punto come il mouse. */}
        {coordinate.map((c, i) => (
          <circle
            key={`contatto-${i}`}
            cx={c.x}
            cy={c.y}
            r={12}
            fill="transparent"
            tabIndex={0}
            aria-label={`${punti[i].data}: ${punti[i].valore}`}
            onFocus={() => setAttivo(i)}
            onBlur={() => setAttivo(null)}
          />
        ))}

        {indiciX.map((i) => (
          <text
            key={`x-${i}`}
            x={coordinate[i].x}
            y={ALTEZZA - 8}
            textAnchor={ancoraggioX(i)}
            fontSize={12}
            fill={COLORI.asse}
          >
            {punti[i].data}
          </text>
        ))}

        <text
          x={ultimo.x - 8}
          y={ultimo.y - 10}
          textAnchor="end"
          fontSize={12}
          fontWeight={600}
          fill={COLORI.inchiostro}
        >
          {punti[punti.length - 1].valore}
        </text>
      </svg>

      {attivo !== null && (
        <div
          className="pointer-events-none absolute -translate-x-1/2 -translate-y-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 shadow-lg"
          style={{ left: sinistraSuggerimento, top: coordinate[attivo].y - 12 }}
        >
          <p className="font-semibold text-slate-100">{punti[attivo].valore}</p>
          <p className="text-xs text-slate-400">{punti[attivo].data}</p>
        </div>
      )}
    </div>
  )
}
