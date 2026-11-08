import path from 'node:path'
import { fileURLToPath } from 'node:url'
import type { NextConfig } from 'next'

// Indica a Turbopack la radice del progetto: nella cartella padre c'è un altro package-lock.json.
const radice = path.dirname(fileURLToPath(import.meta.url))

const nextConfig: NextConfig = {
  turbopack: {
    root: radice,
  },
  // Solo in sviluppo: per provare l'app dal telefono (http://192.168.x.x:3000) il server deve accettare anche le richieste
  // che arrivano dall'indirizzo di rete di casa. Senza, i file JavaScript si scaricano ma React non si collega alla
  // pagina, e i pulsanti (tema, schede, finestre) non rispondono al tocco mentre i link funzionano. Qui valgono le reti
  // di casa 192.168.x.x; online (Vercel) l'impostazione non esiste. Dopo averla cambiata va riavviato `npm run dev`.
  allowedDevOrigins: ['192.168.1.25', '192.168.*.*'],
  // Nodemailer usa i moduli di rete di Node (net, tls, dns): resta fuori dal pacchetto e viene caricato com'è.
  serverExternalPackages: ['nodemailer'],
}

export default nextConfig
