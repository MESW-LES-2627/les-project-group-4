import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { CreateRoomForm } from '@/features/rooms/components/CreateRoomForm'
import { GEOLOCATION_MESSAGES } from '@/features/locations/model/geolocation'

import {
  fillAndSubmitRoom,
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
  'AT-4 — Non-HTTPS: the field explains why, and the browser is never asked',
  { tags: ['acceptance', 'US-15', 'AT-4'] },
  () => {
    it('shows the HTTPS message, never asks for a position, and submits without coordinates', async () => {
      setSecureContext(false)
      const getCurrentPosition = stubGeolocation(() => {})
      const fetchMock = stubCreateRoomApi()
      const user = userEvent.setup()
      render(<CreateRoomForm cities={[]} />)

      const button = screen.getByRole('button', { name: 'Use my location' })
      expect(button).toBeDisabled()
      expect(screen.getByText(GEOLOCATION_MESSAGES.insecure)).toBeInTheDocument()
      expect(screen.getByLabelText('Location (optional)')).toHaveAccessibleDescription(
        GEOLOCATION_MESSAGES.insecure,
      )

      // Trying anyway does nothing: no position request and no API request.
      await user.click(button)
      expect(getCurrentPosition).not.toHaveBeenCalled()
      expect(fetchMock).not.toHaveBeenCalled()

      // Submitting still works, and sends no coordinates. This also proves the spy above
      // sees requests, so its "not called" check can fail.
      await fillAndSubmitRoom(user)
      expect(await screen.findByRole('heading', { name: 'Room created' })).toBeInTheDocument()
      expect(getCurrentPosition).not.toHaveBeenCalled()
      expect(fetchMock).toHaveBeenCalledTimes(1)
      expect(JSON.parse(String(fetchMock.mock.calls[0]![1]?.body))).toEqual({
        name: 'Bedroom',
        widthCm: 300,
        lengthCm: 400,
      })
    })
  },
)
