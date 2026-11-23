import 'dotenv/config'
import { defineConfig } from 'prisma/config'

import { LOCAL_DATABASE_URL } from './src/lib/env'

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
    // CH-02: `npm run db:seed` (= `prisma db seed`) runs this command.
    // `react-server` resolves the `server-only` marker in src/lib/db.ts to its no-op build.
    seed: 'tsx --conditions=react-server prisma/seed.ts',
  },
  datasource: {
    url: databaseUrl,
  },
})
