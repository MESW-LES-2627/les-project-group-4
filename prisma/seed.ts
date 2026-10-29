// CH-02: idempotent seed for cities and catalog items.
// Run with `npm run db:seed` (Prisma calls this file via prisma.config.ts).
// Every upsert is keyed by `slug`, so running the seed again updates rows in
// place: ids stay the same and layouts that reference items never break.

import { PrismaPg } from '@prisma/adapter-pg'
import 'dotenv/config'

import { PrismaClient } from '../src/generated/prisma/client'
import { SEED_CITIES, SEED_ITEMS } from '../src/lib/seed-data'

// Same fallback as prisma.config.ts and src/lib/db.ts.
const LOCAL_DATABASE_URL = 'postgresql://furnimi:furnimi@localhost:5432/furnimi'

const db = new PrismaClient({
  adapter: new PrismaPg(process.env.DATABASE_URL ?? LOCAL_DATABASE_URL),
})

async function main(): Promise<void> {
  for (const { slug, ...data } of SEED_CITIES) {
    await db.city.upsert({ where: { slug }, create: { slug, ...data }, update: data })
  }
  for (const { slug, ...data } of SEED_ITEMS) {
    await db.item.upsert({ where: { slug }, create: { slug, ...data }, update: data })
  }
  console.log(`Seeded ${SEED_CITIES.length} cities and ${SEED_ITEMS.length} items.`)
}

main()
  .catch((error: unknown) => {
    console.error('Seed failed:', error)
    process.exitCode = 1
  })
  .finally(() => db.$disconnect())
