// CH-02: idempotent seed for cities and catalog items.
// Run with `npm run db:seed` (Prisma calls this file via prisma.config.ts).
// Every upsert is keyed by `slug`, so running the seed again updates rows in
// place: ids stay the same and layouts that reference items never break.

import 'dotenv/config'

// The app's client (src/lib/db.ts): one place for the connection setup.
import { getDb } from '../src/lib/db'
import { SEED_CITIES, SEED_ITEMS } from './seed-data'

async function main(): Promise<void> {
  const db = getDb()

  try {
    for (const { slug, ...data } of SEED_CITIES) {
      await db.city.upsert({ where: { slug }, create: { slug, ...data }, update: data })
    }
    for (const { slug, ...data } of SEED_ITEMS) {
      await db.item.upsert({ where: { slug }, create: { slug, ...data }, update: data })
    }
    console.log(`Seeded ${SEED_CITIES.length} cities and ${SEED_ITEMS.length} items.`)
  } finally {
    await db.$disconnect()
  }
}

main().catch((error: unknown) => {
  console.error('Seed failed:', error)
  process.exitCode = 1
})
