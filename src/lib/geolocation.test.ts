import { describe, expect, it } from 'vitest'

import {
  citiesUnavailableMessage,
  createRequestGuard,
  formatAccuracy,
  GEOLOCATION_MESSAGES,
  getGeolocationSupport,
  messageForPositionError,
} from './geolocation'

describe('getGeolocationSupport', () => {
  it('is available in a secure context with geolocation', () => {
    expect(getGeolocationSupport(true, true)).toBe('available')
  })

  it('is unsupported when the browser has no geolocation', () => {
    expect(getGeolocationSupport(true, false)).toBe('unsupported')
  })

})

describe('messageForPositionError', () => {
  it.each([2, 3])('other errors (code %i) get the generic message', (code) => {
    expect(messageForPositionError(code)).toBe(GEOLOCATION_MESSAGES.failed)
  })
})

describe('formatAccuracy', () => {
  it.each([
    [0.4, 'within ~1 m'],
    [34.6, 'within ~35 m'],
    [999, 'within ~999 m'],
    [1000, 'within ~1.0 km'],
    [2345, 'within ~2.3 km'],
  ])('%f m reads "%s"', (metres, label) => {
    expect(formatAccuracy(metres)).toBe(label)
  })
})

describe('createRequestGuard (a late position must not overwrite a newer choice)', () => {
  it('the latest request is current', () => {
    const guard = createRequestGuard()
    const isCurrent = guard.start()

    expect(isCurrent()).toBe(true)
  })

  it('a new request makes the previous one stale', () => {
    const guard = createRequestGuard()
    const first = guard.start()
    const second = guard.start()

    expect(first()).toBe(false)
    expect(second()).toBe(true)
  })

  it('cancel (picking a city, or the form going away) makes the pending request stale', () => {
    const guard = createRequestGuard()
    const isCurrent = guard.start()

    guard.cancel()

    expect(isCurrent()).toBe(false)
  })

  it('a request started after a cancel is current again', () => {
    const guard = createRequestGuard()
    guard.start()
    guard.cancel()
    const isCurrent = guard.start()

    expect(isCurrent()).toBe(true)
  })
})

describe('citiesUnavailableMessage', () => {
  it('offers the current location when the browser can give it', () => {
    expect(citiesUnavailableMessage('available')).toBe(
      'Could not load the cities right now. You can still use your location or create the room without one.',
    )
  })

  it.each(['insecure', 'unsupported', null] as const)(
    'only offers no location when support is %s',
    (support) => {
      expect(citiesUnavailableMessage(support)).toBe(
        'Could not load the cities right now. You can create the room without a location.',
      )
    },
  )
})
