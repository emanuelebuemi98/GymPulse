'use client'

import { useState } from 'react'

type Props = {
  // Il percorso dell'immagine ('/esercizi/barbell-bench-press.jpg'); vuoto se per l'esercizio non ce n'è una.
  src: string
  nome: string
  className?: string
}

// L'immagine di un esercizio. I file sono quadrati di 200 x 200 punti con lo sfondo bianco: width e height lo dicono al
// browser, che riserva lo spazio prima che il file arrivi e la pagina non si sposta. La grandezza a schermo la decide
// `className`; sopra i 200 punti l'immagine sfocherebbe, quindi nessun uso la ingrandisce oltre. Se l'immagine non c'è, o
// se il file non si carica (per esempio è nel database ma non nella cartella), non compare niente: niente icone di
// immagine rotta. Si carica solo quando entra nella pagina (`loading="lazy"`), perché una scheda può avere una dozzina di
// esercizi.
export function ImmagineEsercizio({ src, nome, className = 'size-16' }: Props) {
  const [rotta, setRotta] = useState(false)
  if (src === '' || rotta) return null
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={`Esecuzione: ${nome}`}
      width={200}
      height={200}
      loading="lazy"
      decoding="async"
      onError={() => setRotta(true)}
      className={`${className} shrink-0 rounded-xl border border-bordo bg-white object-cover`}
    />
  )
}
