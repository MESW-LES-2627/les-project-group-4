import { describe, expect, it } from 'vitest'

import { describeOpenError, LAYOUT_NOT_FOUND_MESSAGE } from '@/lib/savedLayouts'

// Showing the alert is UI (no component test harness yet, #66 CH-05); the plan is only
// replaced on a successful load, so a failure leaves it as it was.
describe(
  'AT-6 — Missing layout: opening a layout that no longer exists shows a not-found state',
  { tags: ['acceptance', 'US-14b', 'AT-6'] },
  () => {
    it('shows a clear not-found message for a 404 and drops the layout from the list', () => {
      expect(
        describeOpenError({ status: 404, message: 'Layout not found', fieldErrors: {} }),
      ).toEqual({ message: LAYOUT_NOT_FOUND_MESSAGE, missing: true })
    })

    it('keeps the layout in the list for other failures', () => {
      expect(
        describeOpenError({ status: 500, message: 'The server is unavailable right now.', fieldErrors: {} }),
      ).toEqual({ message: 'The server is unavailable right now.', missing: false })
    })
  },
)
