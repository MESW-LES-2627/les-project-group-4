import { vi } from 'vitest'

// CH-05: browser stubs shared by the US-15 component tests (and CH-05 AT-4).
// jsdom has no geolocation and is not a secure context, so each test sets what it needs.

/** Makes the page a secure (HTTPS) context, or not. */
export function setSecureContext(secure: boolean) {
  Object.defineProperty(window, 'isSecureContext', { value: secure, configurable: true })
}

/**
 * Gives the browser a navigator.geolocation whose getCurrentPosition is the returned mock.
 * The test decides what happens: call the error callback, the success callback, or nothing.
 */
export function stubGeolocation(
  getCurrentPosition: (
    success: PositionCallback,
    error?: PositionErrorCallback | null,
  ) => void,
) {
  const mock = vi.fn(getCurrentPosition)
  Object.defineProperty(navigator, 'geolocation', {
    value: { getCurrentPosition: mock },
    configurable: true,
  })
  return mock
}

/** Removes the stubs, so the next test starts from plain jsdom. */
export function resetBrowserStubs() {
  Reflect.deleteProperty(navigator, 'geolocation')
  Reflect.deleteProperty(window, 'isSecureContext')
}

/** A GeolocationPositionError with the given code (1 = permission denied). */
export function positionError(code: number): GeolocationPositionError {
  return {
    code,
    message: 'stub',
    PERMISSION_DENIED: 1,
    POSITION_UNAVAILABLE: 2,
    TIMEOUT: 3,
  }
}
