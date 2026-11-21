import { describe, expect, it } from 'vitest'

import { GEOLOCATION_MESSAGES, messageForPositionError } from '@/features/locations/model/geolocation'
import { toCreateRoomRequest } from '@/lib/roomValidation'

const formValues = { name: ' Bedroom ', width: '300', length: '400' }

describe(
  'AT-3 — Permission denied: a clear message, and manual city selection still works',
  { tags: ['acceptance', 'US-15', 'AT-3'] },
  () => {
    it('a denied permission gets its own message that points to the city list', () => {
      expect(messageForPositionError(1)).toBe(GEOLOCATION_MESSAGES.denied)
      expect(GEOLOCATION_MESSAGES.denied).toMatch(/denied/)
      expect(GEOLOCATION_MESSAGES.denied).toMatch(/city/)
    })

    it('the form still sends a city chosen by hand', () => {
      expect(toCreateRoomRequest(formValues, { cityId: 1 })).toMatchObject({ cityId: 1 })
    })
  },
)
