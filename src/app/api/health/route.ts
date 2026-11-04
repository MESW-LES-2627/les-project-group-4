import { getDb } from '@/lib/db'

/**
 * Health ping used by the daily Vercel cron.
 *
 * It runs `SELECT 1` so the free Supabase project sees real database activity and
 * does not pause after a week of inactivity. This is a wake-up ping, not monitoring:
 * it says nothing about data correctness or latency.
 */
export async function GET() {
  try {
    await getDb().$queryRaw`SELECT 1`
    return Response.json({ status: 'ok' })
  } catch (error) {
    // Log the details on the server only; the caller gets a generic message.
    console.error('Health check failed', error)
    return Response.json({ status: 'unavailable' }, { status: 503 })
  }
}
