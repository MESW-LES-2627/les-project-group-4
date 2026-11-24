import { screen } from '@testing-library/react'
import type { UserEvent } from '@testing-library/user-event'
import { vi } from 'vitest'

// CH-05: browser stubs and form helpers shared by the US-15 component tests (and CH-05 AT-4).
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

/**
 * Replaces fetch with a fake POST /api/rooms that answers 201 Created. Nothing reaches a
 * real server. Tests read the calls from the returned spy (URL and JSON body).
 */
export function stubCreateRoomApi() {
  return vi.spyOn(globalThis, 'fetch').mockImplementation(async () =>
    Response.json(
      { id: 1, name: 'Bedroom', widthCm: 300, lengthCm: 400, city: null, latitude: null, longitude: null },
      { status: 201 },
    ),
  )
}

/** Fills the three required fields of the create-room form and presses "Create room". */
export async function fillAndSubmitRoom(user: UserEvent) {
  await user.type(screen.getByLabelText(/room name/i), 'Bedroom')
  await user.type(screen.getByLabelText(/width/i), '300')
  await user.type(screen.getByLabelText(/length/i), '400')
  await user.click(screen.getByRole('button', { name: 'Create room' }))
}
