import { describe, expect, it } from 'vitest'

import type { CatalogItem } from '@/features/catalog/types'
import type { RoomSize } from '@/features/plan/model/geometry'
import { DOES_NOT_FIT_MESSAGE } from '@/features/plan/model/placement'

import { EMPTY_DRAFT_STATE, draftReducer } from './draft'
import type { DraftAction } from './draft'
import type { PlacedItem } from './layout'

const room: RoomSize = { widthCm: 300, lengthCm: 200 }
const smallRoom: RoomSize = { widthCm: 100, lengthCm: 100 }

const sofa: CatalogItem = {
  id: 12,
  slug: 'sofa',
  name: 'Sofa',
  category: 'sofa',
  widthCm: 100,
  depthCm: 50,
  heightCm: null,
  priceCents: 49900,
  styleTags: [],
  roomTypeTags: [],
}

const lamp: CatalogItem = {
  ...sofa,
  id: 13,
  slug: 'lamp',
  name: 'Lamp',
  widthCm: 40,
  depthCm: 40,
  priceCents: 3990,
}

const table: CatalogItem = { ...sofa, id: 14, slug: 'table', name: 'Table', depthCm: 100 }

const wardrobe: CatalogItem = {
  ...sofa,
  id: 15,
  slug: 'wardrobe',
  name: 'Wardrobe',
  widthCm: 200,
}

const placedSofa: PlacedItem = {
  id: 'saved-1',
  catalogItemId: 12,
  name: 'Sofa',
  widthCm: 100,
  depthCm: 50,
  priceCents: 49900,
  xCm: 50,
  yCm: 25,
  rotationDeg: 0,
}

function add(
  roomId: number,
  id: string,
  item: CatalogItem,
  inside: RoomSize = room,
): DraftAction {
  return { type: 'add', roomId, room: inside, id, item }
}

describe('draftReducer', () => {
  it('adds a catalog item to its room at the default placement', () => {
    const next = draftReducer(EMPTY_DRAFT_STATE, add(1, 'sofa-1', sofa))

    expect(next.byRoom[1]).toEqual([
      {
        id: 'sofa-1',
        catalogItemId: 12,
        name: 'Sofa',
        widthCm: 100,
        depthCm: 50,
        priceCents: 49900,
        xCm: 50,
        yCm: 25,
        rotationDeg: 0,
      },
    ])
    expect(next.error).toBeNull()
  })

  it('places the next item beside the previous one', () => {
    const first = draftReducer(EMPTY_DRAFT_STATE, add(1, 'sofa-1', sofa))
    const next = draftReducer(first, add(1, 'lamp-1', lamp))

    expect(next.byRoom[1]).toHaveLength(2)
    expect(next.byRoom[1]?.[1]).toMatchObject({ xCm: 120, yCm: 20, rotationDeg: 0 })
  })

  it('keeps each room’s items separate', () => {
    const first = draftReducer(EMPTY_DRAFT_STATE, add(1, 'sofa-1', sofa))
    const next = draftReducer(first, add(2, 'sofa-2', sofa))

    expect(next.byRoom[1]).toHaveLength(1)
    expect(next.byRoom[2]).toHaveLength(1)
    expect(next.byRoom[1]).toBe(first.byRoom[1])
  })

  it('does not add an item that fits nowhere and reports the message', () => {
    const next = draftReducer(EMPTY_DRAFT_STATE, add(1, 'wardrobe-1', wardrobe, smallRoom))

    expect(next.byRoom[1]).toBeUndefined()
    expect(next.error).toEqual({ roomId: 1, message: DOES_NOT_FIT_MESSAGE })
  })

  it('keeps the room’s items when an add fails', () => {
    const filled = draftReducer(EMPTY_DRAFT_STATE, add(1, 'table-1', table, smallRoom))
    const next = draftReducer(filled, add(1, 'lamp-1', lamp, smallRoom))

    expect(next.byRoom).toBe(filled.byRoom)
    expect(next.byRoom[1]).toHaveLength(1)
    expect(next.error).toEqual({ roomId: 1, message: DOES_NOT_FIT_MESSAGE })
  })

  it('clears the error when the same room fits an item again', () => {
    const failed = draftReducer(EMPTY_DRAFT_STATE, add(1, 'wardrobe-1', wardrobe, smallRoom))
    const next = draftReducer(failed, add(1, 'lamp-1', lamp, smallRoom))

    expect(next.error).toBeNull()
    expect(next.byRoom[1]).toHaveLength(1)
  })

  it('keeps another room’s error when a different room succeeds', () => {
    const failed = draftReducer(EMPTY_DRAFT_STATE, add(1, 'wardrobe-1', wardrobe, smallRoom))
    const next = draftReducer(failed, add(2, 'sofa-2', sofa))

    expect(next.error).toEqual({ roomId: 1, message: DOES_NOT_FIT_MESSAGE })
    expect(next.byRoom[2]).toHaveLength(1)
  })

  it('places an item exactly at the requested drop point', () => {
    const next = draftReducer(EMPTY_DRAFT_STATE, {
      type: 'add-at',
      roomId: 1,
      room,
      id: 'sofa-1',
      item: sofa,
      placement: { xCm: 150, yCm: 100, rotationDeg: 0 },
    })

    expect(next.byRoom[1]).toEqual([
      {
        id: 'sofa-1',
        catalogItemId: 12,
        name: 'Sofa',
        widthCm: 100,
        depthCm: 50,
        priceCents: 49900,
        xCm: 150,
        yCm: 100,
        rotationDeg: 0,
      },
    ])
    expect(next.error).toBeNull()
  })

  it('falls back to auto-placement when the drop point is outside the room or overlaps', () => {
    const outside = draftReducer(EMPTY_DRAFT_STATE, {
      type: 'add-at',
      roomId: 1,
      room,
      id: 'sofa-1',
      item: sofa,
      placement: { xCm: 10, yCm: 10, rotationDeg: 0 },
    })
    expect(outside.byRoom[1]?.[0]).toMatchObject({ xCm: 50, yCm: 25, rotationDeg: 0 })

    const filled = draftReducer(EMPTY_DRAFT_STATE, add(1, 'sofa-1', sofa))
    const overlapping = draftReducer(filled, {
      type: 'add-at',
      roomId: 1,
      room,
      id: 'lamp-1',
      item: lamp,
      placement: { xCm: 50, yCm: 25, rotationDeg: 0 },
    })
    expect(overlapping.byRoom[1]?.[1]).toMatchObject({ xCm: 120, yCm: 20, rotationDeg: 0 })
  })

  it('reports the error and keeps the layout when the drop has no space', () => {
    const next = draftReducer(EMPTY_DRAFT_STATE, {
      type: 'add-at',
      roomId: 1,
      room: smallRoom,
      id: 'wardrobe-1',
      item: wardrobe,
      placement: { xCm: 50, yCm: 50, rotationDeg: 0 },
    })

    expect(next.byRoom[1]).toBeUndefined()
    expect(next.error).toEqual({ roomId: 1, message: DOES_NOT_FIT_MESSAGE })
  })

  it('removes only the item with the matching id', () => {
    const first = draftReducer(EMPTY_DRAFT_STATE, add(1, 'sofa-1', sofa))
    const filled = draftReducer(first, add(1, 'lamp-1', lamp))

    const next = draftReducer(filled, { type: 'remove', roomId: 1, id: 'sofa-1' })

    expect(next.byRoom[1]?.map((item) => item.id)).toEqual(['lamp-1'])
  })

  it('removes the error together with the item it was about', () => {
    const filled = draftReducer(EMPTY_DRAFT_STATE, add(1, 'table-1', table, smallRoom))
    const failed = draftReducer(filled, add(1, 'lamp-1', lamp, smallRoom))

    const next = draftReducer(failed, { type: 'remove', roomId: 1, id: 'table-1' })

    expect(next.byRoom[1]).toEqual([])
    expect(next.error).toBeNull()
  })

  it('removing from a room with no items changes nothing', () => {
    expect(draftReducer(EMPTY_DRAFT_STATE, { type: 'remove', roomId: 1, id: 'x' })).toBe(
      EMPTY_DRAFT_STATE,
    )
  })

  it('replaces the room’s items and clears its error', () => {
    const failed = draftReducer(EMPTY_DRAFT_STATE, add(1, 'wardrobe-1', wardrobe, smallRoom))

    const next = draftReducer(failed, { type: 'replace', roomId: 1, items: [placedSofa] })

    expect(next.byRoom[1]).toEqual([placedSofa])
    expect(next.error).toBeNull()
  })

  it('dismisses only the error of the given room', () => {
    const failed = draftReducer(EMPTY_DRAFT_STATE, add(1, 'wardrobe-1', wardrobe, smallRoom))

    expect(draftReducer(failed, { type: 'dismiss-error', roomId: 2 })).toBe(failed)

    const dismissed = draftReducer(failed, { type: 'dismiss-error', roomId: 1 })
    expect(dismissed.error).toBeNull()
    expect(dismissed.byRoom).toBe(failed.byRoom)
  })

  it('never mutates the state it is given', () => {
    const first = draftReducer(EMPTY_DRAFT_STATE, add(1, 'sofa-1', sofa))
    const firstItems = first.byRoom[1]

    const next = draftReducer(first, add(1, 'lamp-1', lamp))

    expect(first.byRoom[1]).toBe(firstItems)
    expect(firstItems).toHaveLength(1)
    expect(next.byRoom[1]).not.toBe(firstItems)
    expect(EMPTY_DRAFT_STATE.byRoom[1]).toBeUndefined()
  })
})
