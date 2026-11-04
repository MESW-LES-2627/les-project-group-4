// US-15: browser geolocation rules, kept out of the component so they can be unit tested.

/** AT-3 and AT-4: what to tell the user when the browser cannot give a location. */
export const GEOLOCATION_MESSAGES = {
  insecure: 'Your location needs a secure (HTTPS) connection. Choose a city instead.',
  unsupported: 'This browser cannot share your location. Choose a city instead.',
  denied:
    'Location permission was denied. Choose a city instead, or allow location in your browser settings.',
  failed: 'Could not get your location. Choose a city instead.',
} as const

export type GeolocationSupport = 'available' | 'insecure' | 'unsupported'

/**
 * AT-4: browsers only allow geolocation in a secure context (HTTPS, or http://localhost).
 * Takes the two facts as arguments so tests can pass any combination.
 */
export function getGeolocationSupport(isSecureContext: boolean, hasGeolocation: boolean): GeolocationSupport {
  if (!isSecureContext) {
    return 'insecure'
  }
  return hasGeolocation ? 'available' : 'unsupported'
}

// GeolocationPositionError.PERMISSION_DENIED (the constant is not available on the server).
const PERMISSION_DENIED = 1

/** AT-3: the message for a failed getCurrentPosition, from the error's `code`. */
export function messageForPositionError(code: number): string {
  return code === PERMISSION_DENIED ? GEOLOCATION_MESSAGES.denied : GEOLOCATION_MESSAGES.failed
}

/**
 * AT-2: how far off the browser's estimate may be, from `coords.accuracy` (metres).
 * Desktop browsers estimate from Wi-Fi or IP, so this can be hundreds of metres.
 */
export function formatAccuracy(metres: number): string {
  if (metres >= 1000) {
    return `within ~${(metres / 1000).toFixed(1)} km`
  }
  return `within ~${Math.max(1, Math.round(metres))} m`
}
