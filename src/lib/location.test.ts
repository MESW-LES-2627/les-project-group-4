import { describe, expect, it } from 'vitest'

import {
  CURRENT_LOCATION_LABEL,
  formatRoomLocation,
  getRoomCoordinates,
  loadLastLocation,
  parseSavedLocation,
  toLocationInput,
} from './location'

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

describe('toLocationInput (AT-5: reuse the last room\'s location)', () => {
  it('turns a city into its id', () => {
    expect(toLocationInput(withCity)).toEqual({ cityId: 1 })
  })

  it('keeps browser coordinates', () => {
    expect(toLocationInput(withCoordinates)).toEqual({ latitude: 41.15, longitude: -8.61 })
  })

  it('gives no location for a room without one', () => {
    expect(toLocationInput(noLocation)).toEqual({})
  })
})

describe('parseSavedLocation', () => {
  it('reads a saved city or saved coordinates', () => {
    expect(parseSavedLocation('{"cityId":1}')).toEqual({ cityId: 1 })
    expect(parseSavedLocation('{"latitude":41.15,"longitude":-8.61}')).toEqual({
      latitude: 41.15,
      longitude: -8.61,
    })
  })

  it.each([
    ['nothing saved', null],
    ['not JSON', '{ nope'],
    ['a bad city id', '{"cityId":-1}'],
    ['only a latitude', '{"latitude":41}'],
    ['a latitude out of range', '{"latitude":91,"longitude":0}'],
    ['a city and coordinates', '{"cityId":1,"latitude":41,"longitude":-8}'],
  ])('gives no location for %s', (_label, raw) => {
    expect(parseSavedLocation(raw)).toEqual({})
  })
})

describe('loadLastLocation', () => {
  it('gives no location instead of throwing when storage is unavailable', () => {
    // Vitest runs in Node, where there is no window.localStorage.
    expect(loadLastLocation()).toEqual({})
  })
})
