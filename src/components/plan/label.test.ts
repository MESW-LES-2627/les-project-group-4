import { describe, expect, it } from 'vitest'

import type { PlacedItem } from '@/lib/layout/layout'

import { itemLabelText } from './label'

const sofa: PlacedItem = {
  id: 'sofa',
  catalogItemId: 1,
  name: 'Sofa',
  widthCm: 200,
  depthCm: 100,
  xCm: 250,
  yCm: 120,
  rotationDeg: 0,
  priceCents: 49900,
}

describe('itemLabelText', () => {
  it('shows the item name when it is not selected', () => {
    expect(itemLabelText(sofa)).toBe('Sofa')
    expect(itemLabelText(sofa, false)).toBe('Sofa')
  })

  it('adds the footprint size when the item is selected', () => {
    expect(itemLabelText(sofa, true)).toBe('Sofa · 200 × 100 cm')
  })
})
