import { describe, expect, it } from 'vitest'

import { toCreateRoomRequest } from './roomValidation'

const values = { name: ' Bedroom ', width: '300', length: '400' }

describe('toCreateRoomRequest (US-15 location)', () => {
  it('sends no location fields when none was chosen', () => {
    expect(toCreateRoomRequest(values)).toEqual({ name: 'Bedroom', widthCm: 300, lengthCm: 400 })
  })

  it('adds the chosen city', () => {
    expect(toCreateRoomRequest(values, { cityId: 1 })).toEqual({
      name: 'Bedroom',
      widthCm: 300,
      lengthCm: 400,
      cityId: 1,
    })
  })

  it('adds the browser coordinates', () => {
    expect(toCreateRoomRequest(values, { latitude: 41.15, longitude: -8.61 })).toMatchObject({
      latitude: 41.15,
      longitude: -8.61,
    })
  })

  it('returns null when the form is invalid, whatever the location', () => {
    expect(toCreateRoomRequest({ ...values, width: '0' }, { cityId: 1 })).toBeNull()
  })
})
