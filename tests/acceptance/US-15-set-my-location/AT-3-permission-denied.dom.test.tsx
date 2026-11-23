import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { CreateRoomForm } from '@/features/rooms/components/CreateRoomForm'
import { GEOLOCATION_MESSAGES } from '@/features/locations/model/geolocation'

import { positionError, resetBrowserStubs, setSecureContext, stubGeolocation } from './fixtures'

afterEach(() => {
  resetBrowserStubs()
  vi.restoreAllMocks()
})

describe(
  'AT-3 — Permission denied: the field shows the message and nothing is sent',
  { tags: ['acceptance', 'US-15', 'AT-3'] },
  () => {
    it('shows the denied message on the location field when the browser refuses', async () => {
      setSecureContext(true)
      const getCurrentPosition = stubGeolocation((_success, error) => error?.(positionError(1)))
      const fetchMock = vi.spyOn(globalThis, 'fetch')
      render(<CreateRoomForm cities={[{ id: 1, name: 'Porto', latitude: 41.1579, longitude: -8.6291 }]} />)

      await userEvent.setup().click(screen.getByRole('button', { name: 'Use my location' }))

      expect(getCurrentPosition).toHaveBeenCalledTimes(1)
      expect(screen.getByRole('alert')).toHaveTextContent(GEOLOCATION_MESSAGES.denied)
      expect(screen.getByLabelText('Location (optional)')).toHaveAttribute('aria-invalid', 'true')
      // The user is not stuck: the button works again and a city can still be picked.
      expect(screen.getByRole('button', { name: 'Use my location' })).toBeEnabled()
      expect(screen.getByRole('option', { name: 'Porto' })).toBeInTheDocument()
      expect(fetchMock).not.toHaveBeenCalled()
    })
  },
)
