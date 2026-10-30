import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@/generated/prisma/client'

// Un solo client per processo: in sviluppo Next ricarica i moduli e aprirebbe troppe connessioni.
const globale = globalThis as unknown as { prisma?: PrismaClient }

function creaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    throw new Error('DATABASE_URL non è impostata: crea il file .env (vedi .env.example)')
  }
  return new PrismaClient({ adapter: new PrismaPg({ connectionString }) })
}

export const db = globale.prisma ?? creaClient()
if (process.env.NODE_ENV !== 'production') globale.prisma = db
