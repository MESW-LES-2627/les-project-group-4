import { describe, expect, it } from 'vitest'

import {
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

  it('AT-4: is unavailable outside a secure context, even if the browser has geolocation', () => {
    expect(getGeolocationSupport(false, true)).toBe('insecure')
    expect(getGeolocationSupport(false, false)).toBe('insecure')
  })

  it('is unsupported when the browser has no geolocation', () => {
    expect(getGeolocationSupport(true, false)).toBe('unsupported')
  })

  it('AT-4: the explanation mentions HTTPS and points to the city list', () => {
    expect(GEOLOCATION_MESSAGES.insecure).toMatch(/HTTPS/)
    expect(GEOLOCATION_MESSAGES.insecure).toMatch(/city/)
  })
})

describe('messageForPositionError', () => {
  it('AT-3: a denied permission gets its own message that points to the city list', () => {
    expect(messageForPositionError(1)).toBe(GEOLOCATION_MESSAGES.denied)
    expect(GEOLOCATION_MESSAGES.denied).toMatch(/denied/)
    expect(GEOLOCATION_MESSAGES.denied).toMatch(/city/)
  })

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
