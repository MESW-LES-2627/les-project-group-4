import { describe, expect, it } from 'vitest'

import { mapServerFieldErrors, pickLocationError, toCreateRoomRequest } from './roomValidation'

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

describe('server location errors (US-15)', () => {
  it('are not form fields, so mapServerFieldErrors leaves them out', () => {
    expect(mapServerFieldErrors({ cityId: 'does not exist' })).toEqual({})
  })

  it('turn an unknown city into a message for the location field', () => {
    expect(pickLocationError({ cityId: 'does not exist' })).toBe(
      'That city is no longer available. Choose another location.',
    )
  })

  it('keep any other city message', () => {
    expect(pickLocationError({ cityId: 'choose a city or your current location, not both' })).toBe(
      'Location: choose a city or your current location, not both.',
    )
  })

  it('turn rejected coordinates into a message for the location field', () => {
    expect(pickLocationError({ latitude: 'must be between -90 and 90' })).toMatch(
      /could not be saved/,
    )
    expect(pickLocationError({ longitude: 'is required with latitude' })).toMatch(
      /could not be saved/,
    )
  })

  it('give nothing when only the name or dimensions failed', () => {
    expect(pickLocationError({ name: 'is required', widthCm: 'must be positive' })).toBeUndefined()
    expect(pickLocationError({})).toBeUndefined()
  })
})
