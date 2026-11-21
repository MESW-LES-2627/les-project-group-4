import { describe, expect, it } from 'vitest'

import { GEOLOCATION_MESSAGES, getGeolocationSupport } from '@/features/locations/model/geolocation'
import { toCreateRoomRequest } from '@/lib/roomValidation'

const formValues = { name: ' Bedroom ', width: '300', length: '400' }

describe(
  'AT-4 — Non-HTTPS: geolocation is unavailable with an explanation',
  { tags: ['acceptance', 'US-15', 'AT-4'] },
  () => {
    it('is unavailable outside a secure context, even if the browser has geolocation', () => {
      expect(getGeolocationSupport(false, true)).toBe('insecure')
      expect(getGeolocationSupport(false, false)).toBe('insecure')
    })

    it('the explanation mentions HTTPS and points to the city list', () => {
      expect(GEOLOCATION_MESSAGES.insecure).toMatch(/HTTPS/)
      expect(GEOLOCATION_MESSAGES.insecure).toMatch(/city/)
    })

    it('the form still sends a city chosen by hand', () => {
      expect(toCreateRoomRequest(formValues, { cityId: 1 })).toMatchObject({ cityId: 1 })
    })
  },
)
