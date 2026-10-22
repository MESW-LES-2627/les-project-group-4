import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@/generated/prisma/client'

// Same fallback as prisma.config.ts: the Postgres started by docker-compose.yaml.
const LOCAL_DATABASE_URL = 'postgresql://furnimi:furnimi@localhost:5432/furnimi'

function createPrismaClient() {
  const adapter = new PrismaPg(process.env.DATABASE_URL ?? LOCAL_DATABASE_URL)
  return new PrismaClient({ adapter })
}

// Reuse one client across hot reloads in development instead of opening a new pool each time.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }

export const db = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = db
}
