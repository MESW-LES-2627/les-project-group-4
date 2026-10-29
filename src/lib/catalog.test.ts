import { describe, expect, it } from 'vitest'

import { CATEGORY_LABELS, ITEM_CATEGORIES, formatPriceCents, isItemCategory } from './catalog'

describe('catalog helpers', () => {
  it('accepts every known category and rejects anything else', () => {
    for (const category of ITEM_CATEGORIES) expect(isItemCategory(category)).toBe(true)
    for (const bad of ['', 'Sofa', 'sofas', 'car', ' sofa']) expect(isItemCategory(bad)).toBe(false)
  })

  it('has a label for every category', () => {
    expect(Object.keys(CATEGORY_LABELS).sort()).toEqual([...ITEM_CATEGORIES].sort())
  })

  it('formats integer cents as euros', () => {
    // pt-PT uses a comma decimal separator and a (non-breaking) space before €.
    expect(formatPriceCents(34900).replace(/\s/g, ' ')).toBe('349,00 €')
    expect(formatPriceCents(5).replace(/\s/g, ' ')).toBe('0,05 €')
  })
})

describe('catalog helpers — edge inputs (added after review)', () => {
  it('rejects case, whitespace and object-prototype names', () => {
    for (const bad of ['SOFA', 'sofa ', 'toString', 'constructor']) expect(isItemCategory(bad)).toBe(false)
  })

  it('formats zero and large prices with a space between thousands (pt-PT)', () => {
    const fmt = (cents: number) => formatPriceCents(cents).replace(/\s/g, ' ')
    expect(fmt(0)).toBe('0,00 €')
    expect(fmt(123456)).toBe('1 234,56 €') // 4-digit euros grouped too (useGrouping: 'always')
    expect(fmt(1234567)).toBe('12 345,67 €')
  })
})

