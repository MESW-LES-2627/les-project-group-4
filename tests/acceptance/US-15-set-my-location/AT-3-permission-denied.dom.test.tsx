import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { CreateRoomForm } from '@/features/rooms/components/CreateRoomForm'
import { GEOLOCATION_MESSAGES } from '@/features/locations/model/geolocation'

import {
  fillAndSubmitRoom,
  positionError,
  resetBrowserStubs,
  setSecureContext,
  stubCreateRoomApi,
  stubGeolocation,
} from './fixtures'

afterEach(() => {
  resetBrowserStubs()
  vi.restoreAllMocks()
})

describe(
  'AT-3 — Permission denied: the field shows the message and nothing is sent',
  { tags: ['acceptance', 'US-15', 'AT-3'] },
  () => {
    it('shows the denied message, sends nothing, and the room is created with a city instead', async () => {
      setSecureContext(true)
      const getCurrentPosition = stubGeolocation((_success, error) => error?.(positionError(1)))
      const fetchMock = stubCreateRoomApi()
      const user = userEvent.setup()
      render(<CreateRoomForm cities={[{ id: 1, name: 'Porto', latitude: 41.1579, longitude: -8.6291 }]} />)

      await user.click(screen.getByRole('button', { name: 'Use my location' }))

      expect(getCurrentPosition).toHaveBeenCalledTimes(1)
      expect(screen.getByRole('alert')).toHaveTextContent(GEOLOCATION_MESSAGES.denied)
      expect(screen.getByLabelText('Location (optional)')).toHaveAttribute('aria-invalid', 'true')
      // Using the location sent nothing: no API call, no reverse geocoding (US-15 AT-6).
      expect(fetchMock).not.toHaveBeenCalled()

      // The user is not stuck: the button works again, a city can be picked and submitted.
      expect(screen.getByRole('button', { name: 'Use my location' })).toBeEnabled()
      await user.selectOptions(screen.getByLabelText('Location (optional)'), 'Porto')
      await fillAndSubmitRoom(user)

      // The only request is the submit, with the chosen city and no coordinates. This also
      // proves the spy above sees requests, so its "not called" check can fail.
      expect(await screen.findByRole('heading', { name: 'Room created' })).toBeInTheDocument()
      expect(fetchMock).toHaveBeenCalledTimes(1)
      expect(fetchMock.mock.calls[0]![0]).toBe('/api/rooms')
      expect(JSON.parse(String(fetchMock.mock.calls[0]![1]?.body))).toEqual({
        name: 'Bedroom',
        widthCm: 300,
        lengthCm: 400,
        cityId: 1,
      })
    })
  },
)
