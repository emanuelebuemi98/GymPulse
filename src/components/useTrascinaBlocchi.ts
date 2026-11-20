'use client'

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type PointerEvent } from 'react'
import { bloccoDi, confiniDiCaduta } from '@/lib/gruppi'

// Il trascinamento degli esercizi di una giornata, con il dito o con il mouse: si afferra la maniglia di una carta e la si porta sopra o sotto
// un altro esercizio. Un esercizio singolo si trascina da solo, uno di una super serie trascina l'intero gruppo (nel gruppo non si entra e
// non si esce: l'ordine dentro il gruppo si cambia con le frecce, che restano anche per chi usa la tastiera).
//
// Il gesto è fatto con i pointer events e senza librerie: la maniglia cattura il puntatore (`setPointerCapture`) e ha `touch-action: none`,
// così il dito non fa scorrere la pagina mentre si trascina. Vicino al bordo alto o basso dello schermo la pagina scorre da sola. Mentre si
// trascina non si sposta niente: si vede una linea nel punto in cui l'esercizio cadrebbe, e lo spostamento avviene al rilascio. Esc annulla.

export type StatoTrascinamento = {
  // Il blocco che si sta trascinando: da quale esercizio parte e quanti ne ha.
  da: number
  quanti: number
  // Il confine dove cadrebbe (da 0 a quanti esercizi), oppure null se resterebbe dov'è. `linea` è dov'è da disegnare, in punti, dall'alto del contenitore.
  confine: number | null
  linea: number | null
}

type Opzioni = {
  voci: { gruppo: number | null }[]
  // Al rilascio: sposta il blocco a cui appartiene l'esercizio `indice` al confine `confine`.
  alRilascio: (indice: number, confine: number) => void
}

type Corrente = { indice: number; da: number; quanti: number; y: number; pointerId: number; confine: number | null; el: HTMLElement }

// A quanti punti dal bordo dello schermo (sotto l'intestazione fissa) la pagina comincia a scorrere, e al massimo di quanti punti per fotogramma.
const FASCIA_SCORRIMENTO = 56
const SCORRIMENTO_MASSIMO = 18

export function useTrascinaBlocchi({ voci, alRilascio }: Opzioni) {
  // Il contenitore dell'elenco: le sue carte sono i `li` dentro il suo `ul`, nell'ordine delle voci.
  const contenitore = useRef<HTMLDivElement>(null)
  const [stato, setStato] = useState<StatoTrascinamento | null>(null)
  const corrente = useRef<Corrente | null>(null)
  // Quando le carte si accorciano (all'inizio) o si allungano e si riordinano (al rilascio) la pagina cambia altezza: la maniglia `el` deve
  // restare dove sta il dito (`y`), così la carta afferrata non scappa da sotto il dito e quella lasciata si vede dove è caduta.
  const ancora = useRef<{ el: HTMLElement; y: number } | null>(null)
  // Vero dal momento in cui il trascinamento si vede (le carte accorciate): solo allora c'è un'altezza da compensare al rilascio.
  const haStato = useRef(false)
  // Le voci e la funzione di rilascio aggiornate: i gestori e il ciclo di scorrimento devono vedere sempre quelle di adesso.
  const vociRef = useRef(voci)
  const rilascioRef = useRef(alRilascio)
  useEffect(() => {
    vociRef.current = voci
    rilascioRef.current = alRilascio
  })

  // Trova il confine più vicino al puntatore tra quelli ammessi e dice dove disegnare la linea.
  const calcola = useCallback(() => {
    const c = corrente.current
    const radice = contenitore.current
    if (!c || !radice) return
    const carte = Array.from(radice.querySelectorAll<HTMLElement>(':scope > ul > li'))
    if (carte.length === 0 || carte.length !== vociRef.current.length) return
    const rette = carte.map((carta) => carta.getBoundingClientRect())
    let migliore: { confine: number; y: number } | null = null
    for (const confine of confiniDiCaduta(vociRef.current)) {
      const y =
        confine === 0
          ? rette[0].top
          : confine === rette.length
            ? rette[rette.length - 1].bottom
            : (rette[confine - 1].bottom + rette[confine].top) / 2
      if (migliore === null || Math.abs(c.y - y) < Math.abs(c.y - migliore.y)) migliore = { confine, y }
    }
    if (!migliore) return
    // Il confine attaccato al blocco stesso non sposta niente: non si disegna la linea.
    const fermo = migliore.confine >= c.da && migliore.confine <= c.da + c.quanti
    c.confine = fermo ? null : migliore.confine
    haStato.current = true
    setStato({
      da: c.da,
      quanti: c.quanti,
      confine: c.confine,
      linea: fermo ? null : migliore.y - radice.getBoundingClientRect().top,
    })
  }, [])

  function fine(annulla: boolean) {
    const c = corrente.current
    corrente.current = null
    document.body.style.userSelect = ''
    // Se il trascinamento non si è mai visto (niente carte accorciate) non c'è nessuna altezza da compensare.
    ancora.current = c && haStato.current ? { el: c.el, y: c.y } : null
    haStato.current = false
    setStato(null)
    if (c && !annulla && c.confine !== null) rilascioRef.current(c.indice, c.confine)
  }

  function inizia(e: PointerEvent<HTMLElement>, indice: number) {
    if (e.button !== 0 || corrente.current) return
    const blocco = bloccoDi(vociRef.current, indice) ?? { da: indice, quanti: 1 }
    e.preventDefault()
    e.currentTarget.setPointerCapture(e.pointerId)
    haStato.current = false
    const rettaManiglia = e.currentTarget.getBoundingClientRect()
    ancora.current = { el: e.currentTarget, y: rettaManiglia.top + rettaManiglia.height / 2 }
    corrente.current = { indice, da: blocco.da, quanti: blocco.quanti, y: e.clientY, pointerId: e.pointerId, confine: null, el: e.currentTarget }
    document.body.style.userSelect = 'none'
    calcola()
  }

  function muovi(e: PointerEvent<HTMLElement>) {
    const c = corrente.current
    if (!c || e.pointerId !== c.pointerId) return
    c.y = e.clientY
    calcola()
  }

  function rilascia(e: PointerEvent<HTMLElement>, annulla: boolean) {
    const c = corrente.current
    if (!c || e.pointerId !== c.pointerId) return
    if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId)
    fine(annulla)
  }

  const inCorso = stato !== null

  // Appena le carte cambiano altezza (inizio e fine del trascinamento) la pagina si riposiziona prima che il browser disegni: la maniglia
  // resta sotto il dito. All'inizio si ricalcola anche la linea, perché le carte accorciate sono in altri punti.
  useLayoutEffect(() => {
    const a = ancora.current
    if (!a) return
    ancora.current = null
    if (!a.el.isConnected) return
    const r = a.el.getBoundingClientRect()
    const scarto = r.top + r.height / 2 - a.y
    if (Math.abs(scarto) > 1) window.scrollBy(0, scarto)
    if (inCorso) calcola()
  }, [inCorso, calcola])

  // Mentre si trascina: la pagina scorre se il puntatore sta vicino a un bordo, e Esc annulla.
  useEffect(() => {
    if (!inCorso) return
    let fotogramma = 0
    const giro = () => {
      const c = corrente.current
      if (c) {
        const sotto = document.querySelector('header')?.getBoundingClientRect().bottom ?? 0
        const alto = Math.max(sotto, 0) + FASCIA_SCORRIMENTO
        const basso = window.innerHeight - FASCIA_SCORRIMENTO
        let passo = 0
        if (c.y < alto) passo = -Math.min(SCORRIMENTO_MASSIMO, (alto - c.y) / 4 + 2)
        else if (c.y > basso) passo = Math.min(SCORRIMENTO_MASSIMO, (c.y - basso) / 4 + 2)
        if (passo !== 0) {
          window.scrollBy(0, passo)
          calcola()
        }
      }
      fotogramma = requestAnimationFrame(giro)
    }
    fotogramma = requestAnimationFrame(giro)
    const alTasto = (e: KeyboardEvent) => {
      if (e.key === 'Escape') fine(true)
    }
    window.addEventListener('keydown', alTasto)
    return () => {
      cancelAnimationFrame(fotogramma)
      window.removeEventListener('keydown', alTasto)
    }
    // `fine` usa solo ref e setStato: non cambia da un disegno all'altro.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inCorso, calcola])

  // Se la pagina si chiude a metà trascinamento, il testo torna selezionabile.
  useEffect(
    () => () => {
      document.body.style.userSelect = ''
    },
    [],
  )

  // Le proprietà da dare alla maniglia della carta in posizione `indice`.
  function maniglia(indice: number) {
    return {
      onPointerDown: (e: PointerEvent<HTMLElement>) => inizia(e, indice),
      onPointerMove: muovi,
      onPointerUp: (e: PointerEvent<HTMLElement>) => rilascia(e, false),
      onPointerCancel: (e: PointerEvent<HTMLElement>) => rilascia(e, true),
    }
  }

  return { contenitore, stato, maniglia }
}
