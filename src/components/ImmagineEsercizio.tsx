'use client'

import { useState } from 'react'

type Props = {
  // Il percorso dell'immagine ('/esercizi/barbell-bench-press.jpg') o dell'animazione ('/gif-esercizi/45_lat-pulldown.gif'); vuoto se per
  // l'esercizio non ce n'è una.
  src: string
  // La foto ferma da mostrare al posto dell'animazione: a chi ha «riduci animazioni» attivo, e se l'animazione non si carica.
  srcFermo?: string
  nome: string
  className?: string
}

// L'immagine di un esercizio. I file sono quadrati con lo sfondo bianco (le foto 200 x 200, le gif 180 x 180): width e height lo dicono al
// browser, che riserva lo spazio prima che il file arrivi e la pagina non si sposta. La grandezza a schermo la decide `className`; sopra la
// grandezza del file l'immagine sfocherebbe, quindi nessun uso la ingrandisce oltre. Se l'immagine non c'è, o se il file non si carica (per
// esempio è nel database ma non nella cartella), non compare niente: niente icone di immagine rotta. Si carica solo quando entra nella pagina
// (`loading="lazy"`), perché una scheda può avere una dozzina di esercizi.
export function ImmagineEsercizio({ src, srcFermo, nome, className = 'size-16' }: Props) {
  // 'nessuno': tutto bene; 'principale': l'animazione non si è caricata e si passa alla foto; 'tutte': non c'è niente da mostrare.
  const [errore, setErrore] = useState<'nessuno' | 'principale' | 'tutte'>('nessuno')
  if (src === '' || errore === 'tutte') return null

  const mostrata = errore === 'principale' && srcFermo ? srcFermo : src
  const immagine = (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={mostrata}
      alt={`Esecuzione: ${nome}`}
      width={200}
      height={200}
      loading="lazy"
      decoding="async"
      onError={() => setErrore(errore === 'nessuno' && srcFermo ? 'principale' : 'tutte')}
      className={`${className} shrink-0 rounded-xl border border-bordo bg-white object-cover`}
    />
  )
  if (!srcFermo || errore !== 'nessuno') return immagine
  // Con «riduci animazioni» il browser sceglie la foto ferma: una gif non si può fermare da codice.
  return (
    <picture className="contents">
      <source media="(prefers-reduced-motion: reduce)" srcSet={srcFermo} />
      {immagine}
    </picture>
  )
}
