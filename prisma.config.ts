import 'dotenv/config'
import { defineConfig } from 'prisma/config'

// Falls back to the Postgres started by docker-compose.yaml, so local development needs no .env.
const LOCAL_DATABASE_URL = 'postgresql://furnimi:furnimi@localhost:5432/furnimi'

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    // CH-02: `npm run db:seed` (= `prisma db seed`) runs this command.
    seed: 'tsx prisma/seed.ts',
  },
  datasource: {
    url: process.env.DATABASE_URL ?? LOCAL_DATABASE_URL,
  },
})
