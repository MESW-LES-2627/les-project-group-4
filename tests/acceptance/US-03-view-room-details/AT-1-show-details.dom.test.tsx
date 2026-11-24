import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import type { Room } from '@/features/rooms/types'

import { renderRoomDetails } from './fixtures'

const room: Room = {
  id: 3,
  name: 'Living room',
  widthCm: 450,
  lengthCm: 500,
  city: { id: 1, name: 'Porto', latitude: 41.1579, longitude: -8.6291 },
  latitude: null,
  longitude: null,
}

describe(
  'AT-1 — Show details: a loaded room shows its name and dimensions',
  { tags: ['acceptance', 'US-03', 'AT-1'] },
  () => {
    it('shows the name as the page heading and the dimensions, area and city underneath', () => {
      renderRoomDetails(room)

      expect(screen.getByRole('heading', { level: 1, name: 'Living room' })).toBeInTheDocument()
      expect(screen.getByText('450 × 500 cm · 22.5 m² · Porto')).toBeInTheDocument()
    })
  },
)
