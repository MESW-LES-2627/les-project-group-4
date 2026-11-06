import { describe, expect, it } from 'vitest'

import { layoutReducer, type PlacedItem } from './layout'

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
