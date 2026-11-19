import { describe, expect, it } from 'vitest'

import {
  createLayoutSchema,
  LAYOUT_ITEMS_MAX,
  LAYOUT_NAME_MAX,
  layoutIdSchema,
} from '@/lib/schemas/layout'
import { toFieldErrors } from '@/lib/schemas/room'

const sofa = { catalogItemId: 4, xCm: 120, yCm: 45.5, rotationDeg: 90 }

function errorsFor(body: unknown) {
  const parsed = createLayoutSchema.safeParse(body)
  return parsed.success ? {} : toFieldErrors(parsed.error)
}

describe('createLayoutSchema', () => {
  it('accepts a name with placed items and trims the name', () => {
    const parsed = createLayoutSchema.parse({ name: '  Cosy corner ', items: [sofa] })

    expect(parsed).toEqual({ name: 'Cosy corner', items: [sofa] })
  })

  it('accepts a layout with no items', () => {
    expect(createLayoutSchema.safeParse({ name: 'Empty', items: [] }).success).toBe(true)
  })

  describe('US-13 AT-1 / AT-4: the name is required', () => {
    it.each([undefined, '', '   '])('rejects the name %j', (name) => {
      expect(errorsFor({ name, items: [] }).name).toBe('is required')
    })

    it(`rejects a name longer than ${LAYOUT_NAME_MAX} characters`, () => {
      expect(errorsFor({ name: 'a'.repeat(LAYOUT_NAME_MAX + 1), items: [] }).name).toMatch(
        /at most/,
      )
    })
  })

  describe('items', () => {
    it('requires the items list', () => {
      expect(errorsFor({ name: 'Plan' }).items).toBeDefined()
    })

    it.each([
      ['a missing catalog id', { xCm: 0, yCm: 0, rotationDeg: 0 }],
      ['a non-integer catalog id', { ...sofa, catalogItemId: 1.5 }],
      ['a zero catalog id', { ...sofa, catalogItemId: 0 }],
      ['a text coordinate', { ...sofa, xCm: '10' }],
      ['an infinite angle', { ...sofa, rotationDeg: Number.POSITIVE_INFINITY }],
      ['a price sent by the client', { ...sofa, priceCents: 1 }],
    ])('rejects an item with %s', (_label, item) => {
      expect(errorsFor({ name: 'Plan', items: [item] }).items).toBeDefined()
    })

    it(`rejects more than ${LAYOUT_ITEMS_MAX} items`, () => {
      const items = Array.from({ length: LAYOUT_ITEMS_MAX + 1 }, () => sofa)
      expect(errorsFor({ name: 'Plan', items }).items).toMatch(/at most/)
    })
  })

  it('rejects unknown fields and non-object bodies', () => {
    expect(errorsFor({ name: 'Plan', items: [], roomId: 2 }).body).toBeDefined()
    expect(errorsFor('Plan').body).toBe('must be a JSON object')
  })
})

describe('layoutIdSchema', () => {
  it('turns a positive whole number into a number', () => {
    expect(layoutIdSchema.parse('12')).toBe(12)
  })

  it.each(['abc', '0', '-1', '1.5', '01', '99999999999'])('rejects "%s"', (id) => {
    expect(layoutIdSchema.safeParse(id).success).toBe(false)
  })
})
