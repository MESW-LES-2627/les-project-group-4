import { describe, expect, it } from 'vitest'

import { CATEGORY_LABELS, ITEM_CATEGORIES } from './catalog'

describe('catalog helpers', () => {
  it('has a label for every category', () => {
    expect(Object.keys(CATEGORY_LABELS).sort()).toEqual([...ITEM_CATEGORIES].sort())
  })
})
