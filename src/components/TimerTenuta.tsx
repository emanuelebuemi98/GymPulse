'use client'

import { useEffect, useRef, useState } from 'react'
import { formatTimer } from '@/lib/allenamento'
import { segnala } from '@/lib/segnale'

const restanti = (inizio: number, totale: number) => Math.max(0, Math.ceil((inizio + totale * 1000 - Date.now()) / 1000))

// Il conto alla rovescia di una serie a tempo (plank, wall sit...). Ha un suo orologio: il modulo della sessione non si ridisegna a
// ogni tick. Il conto parte sempre dall'ora di avvio e non da un contatore, quindi resta giusto anche se il telefono si blocca o la
// scheda sta in secondo piano: al ritorno si rimette in pari da solo. A zero suona e vibra una volta sola e chiama `alFinito`.
//
// Mentre il timer corre chiede al telefono di tenere lo schermo acceso (se lo permette): senza, a metà tenuta lo schermo si
// spegnerebbe e il segnale arriverebbe a un telefono bloccato. Se non si può, il conto resta giusto lo stesso.
export function TimerTenuta({
  inizio,
  totale,
  alFinito,
  className = 'text-3xl leading-none font-extrabold tabular-nums text-accento',
}: {
  inizio: number
  totale: number
  alFinito: () => void
  className?: string
}) {
  const [restano, setRestano] = useState(() => restanti(inizio, totale))
  // L'ultima versione della funzione: così l'intervallo non va rifatto a ogni ridisegno del modulo.
  const alFinitoAggiornato = useRef(alFinito)
  useEffect(() => {
    alFinitoAggiornato.current = alFinito
  })

  useEffect(() => {
    let finito = false
    const aggiorna = () => {
      const mancano = restanti(inizio, totale)
      setRestano(mancano)
      if (mancano === 0 && !finito) {
        finito = true
        segnala()
        alFinitoAggiornato.current()
      }
    }
    aggiorna()
    const intervallo = setInterval(aggiorna, 250)
    return () => clearInterval(intervallo)
  }, [inizio, totale])

  useEffect(() => {
    let blocco: WakeLockSentinel | null = null
    let chiuso = false
    const chiedi = async () => {
      try {
        const ottenuto = await navigator.wakeLock?.request('screen')
        if (!ottenuto) return
        if (chiuso) void ottenuto.release().catch(() => {})
        else blocco = ottenuto
      } catch {
        // non disponibile, o negato (batteria scarica, risparmio energetico): il timer funziona lo stesso
      }
    }
    // Il blocco si perde quando la scheda va in secondo piano: al ritorno si chiede di nuovo.
    const alRitorno = () => {
      if (document.visibilityState === 'visible' && (blocco === null || blocco.released)) void chiedi()
    }
    void chiedi()
    document.addEventListener('visibilitychange', alRitorno)
    return () => {
      chiuso = true
      document.removeEventListener('visibilitychange', alRitorno)
      void blocco?.release().catch(() => {})
    }
  }, [])

  return (
    <span role="timer" aria-live="off" className={className}>
      {formatTimer(restano)}
    </span>
  )
}
