import { afterEach, describe, expect, it, vi } from 'vitest'

import { listItems } from '@/api/client'
import { createLatestRequest, runLatest } from '@/lib/catalogFilters'

afterEach(() => {
  vi.unstubAllGlobals()
})

/** A promise we resolve by hand, to control which response "arrives" first. */
function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((r) => {
    resolve = r
  })
  return { promise, resolve }
}

describe(
  'AT-7 — Stale response: an older response arriving last does not replace newer results',
  { tags: ['acceptance', 'US-08', 'AT-7'] },
  () => {
    it('applies only the newest of two rapid requests, whatever order they finish in', async () => {
      const requests = createLatestRequest()
      const shown: string[] = []
      const older = deferred<string>()
      const newer = deferred<string>()

      // runLatest is what useCatalogItems.load calls for every filter change.
      const load = (response: Promise<string>) =>
        runLatest(requests, () => response, (result) => shown.push(result))

      const first = load(older.promise) // change 1: style=nordic
      const second = load(newer.promise) // change 2: style=nordic&style=modern
      newer.resolve('nordic+modern')
      await second
      older.resolve('nordic') // the older response arrives last
      await first

      expect(shown).toEqual(['nordic+modern'])
    })

    it('aborts the older request when a newer one starts', () => {
      const requests = createLatestRequest()

      const older = requests.start()
      const newer = requests.start()

      expect(older.signal.aborted).toBe(true)
      expect(older.isLatest()).toBe(false)
      expect(newer.signal.aborted).toBe(false)
      expect(newer.isLatest()).toBe(true)
    })

    it('after cancel (leaving the page) a pending response is not applied', async () => {
      const requests = createLatestRequest()
      const shown: string[] = []
      const pending = deferred<string>()

      const run = runLatest(requests, () => pending.promise, (result) => shown.push(result))
      requests.cancel()
      pending.resolve('late')
      await run

      expect(shown).toEqual([])
    })

    it('listItems sends the filters and the abort signal to fetch', async () => {
      const fetchMock = vi.fn().mockResolvedValue(new Response('[]', { status: 200 }))
      vi.stubGlobal('fetch', fetchMock)
      const controller = new AbortController()

      const result = await listItems({ style: ['nordic', 'modern'] }, controller.signal)

      expect(result).toEqual({ ok: true, data: [] })
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/items?style=nordic&style=modern',
        expect.objectContaining({ method: 'GET', signal: controller.signal }),
      )
    })
  },
)
