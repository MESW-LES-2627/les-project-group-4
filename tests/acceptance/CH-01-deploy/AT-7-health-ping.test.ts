import { beforeEach, describe, expect, it, vi } from 'vitest'

import { GET } from '@/app/api/health/route'

const { ping } = vi.hoisted(() => ({ ping: vi.fn() }))

vi.mock('@/lib/db', () => ({
  pingDatabase: ping,
}))

beforeEach(() => {
  ping.mockReset()
  vi.restoreAllMocks() // undo the console.error spy from the previous test
})

describe(
  'AT-7 — Health ping: /api/health pings the database and reports 200',
  { tags: ['acceptance', 'CH-01', 'AT-7'] },
  () => {
    it('pings the database and returns 200 when it answers', async () => {
      ping.mockResolvedValue(undefined)

      const response = await GET()

      expect(response.status).toBe(200)
      expect(await response.json()).toEqual({ status: 'ok' })
      expect(ping).toHaveBeenCalledTimes(1)
    })

    it('returns 503 without leaking the error when the database is unreachable', async () => {
      // The route logs the real error on the server; catch that log so it is not
      // printed during the test run (it looks like a failure, but it is expected).
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
      ping.mockRejectedValue(new Error('connection refused'))

      const response = await GET()
      const text = await response.text()

      expect(response.status).toBe(503)
      expect(text).not.toContain('connection refused')
      expect(text).not.toMatch(/\bat \S+:\d+:\d+/) // no stack-trace lines
      expect(consoleError).toHaveBeenCalled() // the details were logged on the server
    })
  },
)
