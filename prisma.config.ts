import 'dotenv/config'
import { defineConfig } from 'prisma/config'

// Falls back to the Postgres started by docker-compose.yaml, so local development needs no .env.
const LOCAL_DATABASE_URL = 'postgresql://furnimi:furnimi@localhost:5432/furnimi'

// Migrations run against the session pooler (port 5432). The transaction pooler
// (port 6543) used by the app breaks the DDL and prepared statements that
// `prisma migrate deploy` needs. Prisma 7's config has no `directUrl`, so the
// split is explicit: DIRECT_DATABASE_URL here, DATABASE_URL in src/lib/db.ts.
const databaseUrl =
  process.env.DIRECT_DATABASE_URL ?? process.env.DATABASE_URL ?? LOCAL_DATABASE_URL

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: databaseUrl,
  },
})
