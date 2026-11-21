import { describe, expect, it } from 'vitest'

import type { LayoutSummary } from '@/features/rooms/types'
import type { ApiError } from '@/lib/http'
import { isAlreadyDeleted, savedConfirmation, visibleLayouts } from '@/features/rooms/model/savedLayouts'

const cosy: LayoutSummary = { id: 1, name: 'Cosy corner', itemCount: 3, updatedAt: '2026-11-12T10:00:00.000Z' }
const office: LayoutSummary = { id: 2, name: 'Office', itemCount: 1, updatedAt: '2026-11-12T11:00:00.000Z' }

function apiError(status: number): ApiError {
  return { status, message: 'message', fieldErrors: {} }
}

// The confirm/cancel buttons are UI (no component test harness yet, #66 CH-05);
// these tests cover what the list does once a delete is confirmed.
describe(
  'AT-5 — Delete: a confirmed delete removes the layout from the list',
  { tags: ['acceptance', 'US-14b', 'AT-5'] },
  () => {
    it('removes the deleted layout and keeps the others in order', () => {
      expect(visibleLayouts([cosy, office], new Set([1]))).toEqual([office])
    })

    it('keeps every layout while nothing was deleted (cancelling deletes nothing)', () => {
      expect(visibleLayouts([cosy, office], new Set())).toEqual([cosy, office])
    })

    it('also removes a layout another tab already deleted (404)', () => {
      expect(isAlreadyDeleted(apiError(404))).toBe(true)
    })

    it.each([0, 400, 500])('keeps the layout when the delete fails with status %i', (status) => {
      expect(isAlreadyDeleted(apiError(status))).toBe(false)
    })

    it('drops the "Saved …" confirmation once that layout is deleted', () => {
      expect(savedConfirmation({ id: 1, name: 'Cosy corner' }, [cosy, office])).toBe('Cosy corner')
      expect(savedConfirmation({ id: 1, name: 'Cosy corner' }, [office])).toBeNull()
    })
  },
)
