import path from 'node:path'
import { fileURLToPath } from 'node:url'
import type { NextConfig } from 'next'

// Indica a Turbopack la radice del progetto: nella cartella padre c'è un altro package-lock.json.
const radice = path.dirname(fileURLToPath(import.meta.url))

const nextConfig: NextConfig = {
  turbopack: {
    root: radice,
  },
  // Nodemailer usa i moduli di rete di Node (net, tls, dns): resta fuori dal pacchetto e viene caricato com'è.
  serverExternalPackages: ['nodemailer'],
}

export default nextConfig
