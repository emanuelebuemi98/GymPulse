import path from 'node:path'
import { fileURLToPath } from 'node:url'
import type { NextConfig } from 'next'

// Indica a Turbopack la radice del progetto: nella cartella padre c'è un altro package-lock.json.
const radice = path.dirname(fileURLToPath(import.meta.url))

const nextConfig: NextConfig = {
  turbopack: {
    root: radice,
  },
}

export default nextConfig
