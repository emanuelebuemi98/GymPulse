'use client'

import { useEffect, useState } from 'react'
import { formatTrascorso } from '@/lib/formato'

const secondiDa = (inizio: number) => Math.max(0, Math.floor((Date.now() - inizio) / 1000))

// Il tempo dall'inizio della sessione, come un cronometro. Ha un suo orologio: il modulo della sessione non si ridisegna
// a ogni secondo. Il conto parte sempre dall'ora di inizio e non da un contatore, quindi resta giusto anche se il telefono
// si blocca o la scheda sta in secondo piano: al ritorno si rimette in pari da solo.
export function TempoTrascorso({ inizio }: { inizio: number }) {
  const [secondi, setSecondi] = useState(() => secondiDa(inizio))

  useEffect(() => {
    const aggiorna = () => setSecondi(secondiDa(inizio))
    aggiorna()
    const intervallo = setInterval(aggiorna, 500)
    return () => clearInterval(intervallo)
  }, [inizio])

  return <span className="tabular-nums">{formatTrascorso(secondi)}</span>
}
