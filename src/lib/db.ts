import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@/generated/prisma/client'
import { resolveDatabaseUrl } from '@/lib/databaseUrl'

function createPrismaClient() {
  // Resolving lazily (not at import time) keeps `next build` working without a
  // database, while a production server with a missing DATABASE_URL still fails
  // on the first query instead of connecting to localhost.
  const adapter = new PrismaPg(resolveDatabaseUrl())
  return new PrismaClient({ adapter })
}

// Reuse one client across hot reloads in development instead of opening a new pool each time.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }

let prisma: PrismaClient | undefined

/** Returns the shared Prisma client, creating it on first use. */
export function getDb(): PrismaClient {
  prisma ??= globalForPrisma.prisma ?? createPrismaClient()

  if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = prisma
  }

  return prisma
}
