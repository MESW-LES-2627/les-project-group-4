/**
 * The Postgres started by `docker-compose.yaml`. Local development needs no
 * `.env` because both the app and Prisma fall back to this URL.
 */
export const LOCAL_DATABASE_URL = 'postgresql://furnimi:furnimi@localhost:5432/furnimi'

type DatabaseEnv = {
  DATABASE_URL?: string
  NODE_ENV?: string
}

/**
 * Picks the runtime database URL.
 *
 * Outside production we fall back to the local Docker database. In production a
 * missing secret must fail loudly: silently connecting to localhost would hide a
 * broken deployment behind connection errors. Never log the URL itself, since it
 * contains the database password.
 */
export function resolveDatabaseUrl(env: DatabaseEnv = process.env): string {
  if (env.DATABASE_URL) return env.DATABASE_URL

  if (env.NODE_ENV === 'production') {
    throw new Error(
      'DATABASE_URL is not set. Configure it in the hosting provider (Supabase transaction pooler, port 6543) instead of falling back to the local database.',
    )
  }

  return LOCAL_DATABASE_URL
}
