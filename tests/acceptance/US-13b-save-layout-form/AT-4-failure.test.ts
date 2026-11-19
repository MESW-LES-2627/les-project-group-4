import { describe, expect, it } from 'vitest'

import { describeSaveError } from '@/lib/saveLayout'

describe(
  'AT-4 — Failure: when the API fails, a clear error is shown for the form',
  { tags: ['acceptance', 'US-13b', 'AT-4'] },
  () => {
    it('shows a server failure as a form message, not next to the name', () => {
      expect(
        describeSaveError({ status: 500, message: 'The server is unavailable right now.', fieldErrors: {} }),
      ).toEqual({ formError: 'The server is unavailable right now.' })
    })

    it('shows an unreachable server as a form message', () => {
      expect(
        describeSaveError({ status: 0, message: 'Could not reach the server.', fieldErrors: {} }),
      ).toEqual({ formError: 'Could not reach the server.' })
    })
  },
)
