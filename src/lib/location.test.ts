import { describe, expect, it } from 'vitest'

import { CURRENT_LOCATION_LABEL, formatRoomLocation, getRoomCoordinates } from './location'

const porto = { id: 1, name: 'Porto', latitude: 41.1579, longitude: -8.6291 }
const noLocation = { city: null, latitude: null, longitude: null }
const withCity = { ...noLocation, city: porto }
const withCoordinates = { city: null, latitude: 41.15, longitude: -8.61 }

describe('formatRoomLocation', () => {
  it('AT-1: shows the city name', () => {
    expect(formatRoomLocation(withCity)).toBe('Porto')
  })

  it('AT-2: shows "Current location" for coordinates without a city', () => {
    expect(formatRoomLocation(withCoordinates)).toBe(CURRENT_LOCATION_LABEL)
    expect(CURRENT_LOCATION_LABEL).toBe('Current location')
  })

  it('returns null when the room has no location', () => {
    expect(formatRoomLocation(noLocation)).toBeNull()
  })
})

describe('getRoomCoordinates (AT-5: reuse the saved location)', () => {
  it("uses the city's coordinates", () => {
    expect(getRoomCoordinates(withCity)).toEqual({ latitude: 41.1579, longitude: -8.6291 })
  })

  it('uses the saved browser coordinates', () => {
    expect(getRoomCoordinates(withCoordinates)).toEqual({ latitude: 41.15, longitude: -8.61 })
  })

  it('returns null when the room has no location', () => {
    expect(getRoomCoordinates(noLocation)).toBeNull()
  })
})
