// Dove il browser ricorda il tema scelto col pulsante sole/luna ('light' o 'dark'). Senza scelta vale quello del telefono.
// Sta qui e non nel pulsante perché lo usano sia il pulsante (browser) sia il layout (server): un valore esportato da un
// file 'use client' non si può leggere dal server.
export const CHIAVE_TEMA = 'gympulse_tema'

// Rimette il tema scelto prima del primo disegno della pagina: senza, chi ha scelto il tema opposto a quello del telefono
// vedrebbe un lampo del tema sbagliato a ogni apertura. Gira nel browser, scritto come testo perché finisce in un <script>.
export const SCRIPT_TEMA = `try{var t=localStorage.getItem('${CHIAVE_TEMA}');if(t==='dark'||t==='light')document.documentElement.dataset.theme=t}catch(e){}`

export const COLORI_BARRA = { chiaro: '#eef2ea', scuro: '#0a130e' } as const
