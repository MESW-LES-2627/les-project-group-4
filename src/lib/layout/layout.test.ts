import { describe, expect, it } from 'vitest'

import type { CatalogItem } from '@/features/catalog/types'
import type { Placement } from '@/lib/geometry/plan'

import { toPlacedItem } from './layout'

const catalogSofa: CatalogItem = {
  id: 12,
  slug: 'sofa-nordic-3-seat',
  name: 'Nordic 3-seat sofa',
  category: 'sofa',
  widthCm: 200,
  depthCm: 100,
  heightCm: 80,
  priceCents: 49900,
  styleTags: ['nordic'],
  roomTypeTags: ['living-room'],
}

const placement: Placement = { xCm: 50, yCm: 25, rotationDeg: 0 }

describe('toPlacedItem', () => {
  it('maps the catalog fields and the placement into a placed item', () => {
    expect(toPlacedItem(catalogSofa, 'draft-1', placement)).toEqual({
      id: 'draft-1',
      catalogItemId: 12,
      name: 'Nordic 3-seat sofa',
      widthCm: 200,
      depthCm: 100,
      priceCents: 49900,
      xCm: 50,
      yCm: 25,
      rotationDeg: 0,
    })
  })

  it('gives every added item its own id', () => {
    const first = toPlacedItem(catalogSofa, 'draft-1', placement)
    const second = toPlacedItem(catalogSofa, 'draft-2', placement)

    expect(first.id).not.toBe(second.id)
    expect(first.catalogItemId).toBe(second.catalogItemId)
  })

  it('drops the fields the plan does not use', () => {
    const placed = toPlacedItem(catalogSofa, 'draft-1', placement)

    expect(placed).not.toHaveProperty('slug')
    expect(placed).not.toHaveProperty('category')
    expect(placed).not.toHaveProperty('heightCm')
    expect(placed).not.toHaveProperty('styleTags')
    expect(placed).not.toHaveProperty('roomTypeTags')
  })

  it('snapshots the price when the item is added', () => {
    const item: CatalogItem = { ...catalogSofa }

    const placed = toPlacedItem(item, 'draft-1', placement)
    item.priceCents = 1

    expect(placed.priceCents).toBe(49900)
  })
})
