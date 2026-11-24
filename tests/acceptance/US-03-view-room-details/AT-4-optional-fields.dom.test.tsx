import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import type { Room } from '@/features/rooms/types'

import { renderRoomDetails } from './fixtures'

const roomWithoutLocation: Room = {
  id: 4,
  name: 'Bedroom',
  widthCm: 300,
  lengthCm: 400,
  city: null,
  latitude: null,
  longitude: null,
}

describe(
  'AT-4 — Optional fields: a room without a location has no empty location label',
  { tags: ['acceptance', 'US-03', 'AT-4'] },
  () => {
    it('shows only the dimensions and area, with no trailing separator or placeholder', () => {
      renderRoomDetails(roomWithoutLocation)

      expect(screen.getByRole('heading', { level: 1, name: 'Bedroom' })).toBeInTheDocument()
      // Exact text: "300 × 400 cm · 12 m²" with nothing after it (no " · ", no "null").
      expect(screen.getByText('300 × 400 cm · 12 m²')).toBeInTheDocument()
      expect(screen.queryByText(/12 m² ·/)).not.toBeInTheDocument()
      expect(screen.queryByText(/null|undefined|Current location/)).not.toBeInTheDocument()
    })
  },
)
