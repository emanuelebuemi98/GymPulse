import 'dotenv/config'
import { defineConfig } from 'prisma/config'

// Senza DATABASE_URL `prisma generate` deve comunque funzionare (es. al postinstall):
// l'URL serve solo a migrate e seed, che daranno un errore esplicito se manca.
export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx prisma/seed.ts',
  },
  datasource: {
    url: process.env.DATABASE_URL ?? '',
  },
})
