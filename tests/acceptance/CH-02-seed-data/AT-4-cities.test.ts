import { describe, expect, it } from 'vitest'

import { SEED_CITIES } from '../../../prisma/seed-data'

// Rough bounding box of mainland Portugal: catches swapped or mistyped coordinates.
const inPortugal = (lat: number, lng: number) =>
  lat > 36.8 && lat < 42.2 && lng > -9.6 && lng < -6.1

describe(
  'AT-4 — Cities: the seeded city list is valid for the location picker',
  { tags: ['acceptance', 'CH-02', 'AT-4'] },
  () => {
    it('cities have coordinates inside Portugal', () => {
      for (const place of SEED_CITIES) {
        expect(inPortugal(place.latitude, place.longitude)).toBe(true)
      }
    })

    it('every city name fits its VARCHAR column', () => {
      for (const city of SEED_CITIES) {
        expect(city.slug.length).toBeLessThanOrEqual(100)
        expect(city.name.length).toBeLessThanOrEqual(100)
      }
    })

    it('country is exactly two upper-case letters (CHAR(2), ISO 3166-1)', () => {
      for (const city of SEED_CITIES) expect(city.country).toMatch(/^[A-Z]{2}$/)
    })
  },
)
