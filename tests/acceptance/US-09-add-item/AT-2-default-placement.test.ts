import { describe, expect, it } from 'vitest'

import type { CatalogItem } from '@/api/types'
import type { RoomSize } from '@/lib/geometry/plan'
import { placeInRoom } from '@/lib/layout/placement'
import type { PlacedFootprint } from '@/lib/layout/placement'

const room: RoomSize = { widthCm: 300, lengthCm: 200 }

const sofa: CatalogItem = {
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

const lamp: CatalogItem = {
  ...sofa,
  id: 13,
  slug: 'lamp-arc-floor',
  name: 'Arc floor lamp',
  category: 'lighting',
  widthCm: 40,
  depthCm: 40,
  heightCm: 170,
  priceCents: 3990,
}

describe(
  'AT-2 — Default placement: new items fill the top wall left to right, then the next row',
  { tags: ['acceptance', 'US-09a', 'AT-2'] },
  () => {
    it('places the first item against the top-left corner at rotation 0', () => {
      expect(placeInRoom(sofa, room)).toEqual({ xCm: 100, yCm: 50, rotationDeg: 0 })
    })

    it('continues to the right of the previous item', () => {
      const first = placeInRoom(sofa, room)
      if (first === null) throw new Error('expected the sofa to fit')

      expect(placeInRoom(lamp, room, [{ ...sofa, ...first }])).toEqual({
        xCm: 220,
        yCm: 20,
        rotationDeg: 0,
      })
    })

    it('moves to the next row when the row is full', () => {
      const table = { widthCm: 100, depthCm: 100 }
      const tallRoom: RoomSize = { widthCm: 200, lengthCm: 300 }
      const placed: PlacedFootprint[] = []

      for (let index = 0; index < 3; index += 1) {
        const placement = placeInRoom(table, tallRoom, placed)
        if (placement === null) throw new Error('expected a free row')
        placed.push({ ...table, ...placement })
      }

      expect(placed.map(({ xCm, yCm }) => [xCm, yCm])).toEqual([
        [50, 50],
        [150, 50],
        [50, 150],
      ])
    })
  },
)
