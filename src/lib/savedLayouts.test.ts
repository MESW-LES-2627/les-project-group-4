import { describe, expect, it } from 'vitest'

import type { ApiError, LayoutSummary } from '@/api/types'
import {
  formatItemCount,
  isAlreadyDeleted,
  savedConfirmation,
  visibleLayouts,
} from '@/lib/savedLayouts'

const cosy: LayoutSummary = { id: 1, name: 'Cosy corner', itemCount: 3, updatedAt: '2026-11-12T10:00:00.000Z' }
const office: LayoutSummary = { id: 2, name: 'Office', itemCount: 1, updatedAt: '2026-11-12T11:00:00.000Z' }

function apiError(status: number): ApiError {
  return { status, message: 'message', fieldErrors: {} }
}

describe('formatItemCount', () => {
  it.each([
    [0, '0 items'],
    [1, '1 item'],
    [2, '2 items'],
  ])('formats %i as %j', (count, text) => {
    expect(formatItemCount(count)).toBe(text)
  })
})

describe('visibleLayouts', () => {
  it('keeps every layout when none was deleted', () => {
    expect(visibleLayouts([cosy, office], new Set())).toEqual([cosy, office])
  })

  it('hides the deleted layouts and keeps the order of the rest', () => {
    expect(visibleLayouts([cosy, office], new Set([1]))).toEqual([office])
  })

  it('ignores deleted ids that are not in the list', () => {
    expect(visibleLayouts([cosy], new Set([99]))).toEqual([cosy])
  })
})

describe('savedConfirmation', () => {
  it('is null when nothing was saved', () => {
    expect(savedConfirmation(null, [cosy])).toBeNull()
  })

  it('names the saved layout while it is in the list', () => {
    expect(savedConfirmation({ id: 1, name: 'Cosy corner' }, [cosy, office])).toBe('Cosy corner')
  })

  it('is null once the saved layout was deleted', () => {
    expect(savedConfirmation({ id: 1, name: 'Cosy corner' }, [office])).toBeNull()
  })
})

describe('isAlreadyDeleted', () => {
  it('treats 404 as already deleted', () => {
    expect(isAlreadyDeleted(apiError(404))).toBe(true)
  })

  it.each([0, 400, 500])('keeps the layout for status %i', (status) => {
    expect(isAlreadyDeleted(apiError(status))).toBe(false)
  })
})
