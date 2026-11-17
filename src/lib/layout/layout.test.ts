import { describe, expect, it } from 'vitest'

import type { CatalogItem } from '@/api/types'
import type { Placement } from '@/lib/geometry/plan'

import { layoutReducer, toPlacedItem, type PlacedItem } from './layout'

const sofa: PlacedItem = {
  id: 'item-1',
  catalogItemId: 12,
  name: 'Sofa',
  widthCm: 200,
  depthCm: 100,
  xCm: 250,
  yCm: 120,
  rotationDeg: 90,
  priceCents: 49900,
}

const lamp: PlacedItem = {
  ...sofa,
  id: 'item-2',
  name: 'Floor lamp',
  widthCm: 40,
  depthCm: 40,
  priceCents: 3990,
}

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

describe('layoutReducer', () => {
  it('adds an item without mutating the previous list', () => {
    const items: PlacedItem[] = []

    const next = layoutReducer(items, { type: 'add', item: sofa })

    expect(next).toEqual([sofa])
    expect(next[0]).toBe(sofa)
    expect(items).toEqual([])
    expect(next).not.toBe(items)
  })

  it('keeps the existing order when adding', () => {
    const next = layoutReducer([sofa], { type: 'add', item: lamp })

    expect(next).toEqual([sofa, lamp])
  })

  it('removes only the item with the matching id', () => {
    const next = layoutReducer([sofa, lamp], { type: 'remove', id: sofa.id })

    expect(next).toEqual([lamp])
    expect(next[0]).toBe(lamp)
  })

  it('returns a new list unchanged when the id is not in the layout', () => {
    const items = [sofa]

    const next = layoutReducer(items, { type: 'remove', id: 'missing' })

    expect(next).toEqual(items)
    expect(next).not.toBe(items)
  })

  it('replaces the whole list', () => {
    const next = layoutReducer([sofa], { type: 'replace', items: [lamp] })

    expect(next).toEqual([lamp])
    expect(next[0]).toBe(lamp)
  })
})

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
