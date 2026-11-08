'use client'

import { useEffect } from 'react'
import { CHIAVE_TEMA, COLORI_BARRA } from '@/lib/tema'
import { IconaLuna, IconaSole } from './icone'

function èScuro(): boolean {
  const scelto = document.documentElement.dataset.theme
  if (scelto === 'dark') return true
  if (scelto === 'light') return false
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

// La barra del browser sul telefono (theme-color) segue il tema che si vede, anche quando è stato scelto col pulsante e non
// dal telefono: il tag con media="(prefers-color-scheme)" altrimenti guarderebbe solo l'impostazione del sistema.
function coloraBarra(scuro: boolean) {
  const colore = scuro ? COLORI_BARRA.scuro : COLORI_BARRA.chiaro
  const tag = document.querySelectorAll('meta[name="theme-color"]')
  if (tag.length === 0) {
    const nuovo = document.createElement('meta')
    nuovo.name = 'theme-color'
    nuovo.content = colore
    document.head.appendChild(nuovo)
    return
  }
  tag.forEach((meta) => {
    meta.setAttribute('content', colore)
    meta.removeAttribute('media')
  })
}

// Pulsante sole/luna. Parte dal tema del telefono; al primo tocco passa all'altro e da lì in poi ricorda la scelta in
// questo browser. Le due icone ci sono sempre: quale si vede lo decide il CSS (globals.css), così pagina del server e
// pagina del browser sono uguali e non c'è nessun cambio visibile al caricamento.
export function TemaPulsante({ className = '' }: { className?: string }) {
  useEffect(() => {
    // Solo se la persona ha già scelto: senza scelta resta il colore che il telefono assegna da solo.
    if (document.documentElement.dataset.theme) coloraBarra(èScuro())
  }, [])

  function cambia() {
    const nuovo = èScuro() ? 'light' : 'dark'
    document.documentElement.dataset.theme = nuovo
    try {
      localStorage.setItem(CHIAVE_TEMA, nuovo)
    } catch {
      // Navigazione privata o dati bloccati: il tema cambia lo stesso, solo che non si ricorda.
    }
    coloraBarra(nuovo === 'dark')
  }

  return (
    <button
      type="button"
      onClick={cambia}
      aria-label="Cambia tema: chiaro o scuro"
      title="Cambia tema"
      className={`grid size-10 place-items-center rounded-full text-muto transition active:bg-carta-alta ${className}`}
    >
      <IconaLuna className="tema-luna size-5" />
      <IconaSole className="tema-sole size-5" />
    </button>
  )
}
