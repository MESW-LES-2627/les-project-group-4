import { describe, expect, it } from 'vitest'
import { z } from 'zod'

import { ITEM_CATEGORIES } from '@/lib/catalog'

import { isItemCategory, itemCategorySchema, listItemsQuerySchema } from './item'
import { toFieldErrors } from './room'

describe('itemCategorySchema', () => {
  it.each(ITEM_CATEGORIES)('accepts %s', (category) => {
    const result = itemCategorySchema.safeParse(category)

    expect(result.success).toBe(true)
  })

  it.each([
    ['unknown', 'rug'],
    ['empty', ''],
    ['capitalised', 'Sofa'],
    ['upper-case', 'SOFA'],
    ['plural', 'sofas'],
    ['leading-space', ' sofa'],
    ['trailing-space', 'sofa '],
    ['prototype-name', 'toString'],
    ['constructor', 'constructor'],
    ['number', 42],
    ['null', null],
  ])('rejects a %s value', (_label, value) => {
    const result = itemCategorySchema.safeParse(value)

    expect(result.success).toBe(false)
  })

  it('gives the field error the API returns, via toFieldErrors', () => {
    const query = z.object({ category: itemCategorySchema.optional() })

    const result = query.safeParse({ category: 'rug' })

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(toFieldErrors(result.error)).toEqual({
        category: 'must be one of: sofa, armchair, bed, table, chair, desk, storage, lighting',
      })
    }
  })

  it('treats a missing category as valid ("all categories")', () => {
    const query = z.object({ category: itemCategorySchema.optional() })

    const result = query.safeParse({})

    expect(result.success).toBe(true)
  })
})

describe('isItemCategory', () => {
  it('agrees with itemCategorySchema', () => {
    expect(isItemCategory('sofa')).toBe(true)
    expect(isItemCategory('rug')).toBe(false)
  })
})

describe('listItemsQuerySchema', () => {
  it('accepts no category (all items) and a known category', () => {
    expect(listItemsQuerySchema.safeParse({}).success).toBe(true)
    expect(listItemsQuerySchema.safeParse({ category: undefined }).success).toBe(true)
    expect(listItemsQuerySchema.safeParse({ category: 'sofa' }).success).toBe(true)
  })

  it.each([
    ['unknown', 'rug'],
    ['repeated', ['sofa', 'bed']], // ?category=sofa&category=bed on the page
  ])('rejects a %s category', (_label, category) => {
    const result = listItemsQuerySchema.safeParse({ category })

    expect(result.success).toBe(false)
  })
})
