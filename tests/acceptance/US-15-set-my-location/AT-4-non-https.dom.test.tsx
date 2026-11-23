import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { CreateRoomForm } from '@/features/rooms/components/CreateRoomForm'
import { GEOLOCATION_MESSAGES } from '@/features/locations/model/geolocation'

import { resetBrowserStubs, setSecureContext, stubGeolocation } from './fixtures'

afterEach(() => {
  resetBrowserStubs()
  vi.restoreAllMocks()
})

describe(
  'AT-4 — Non-HTTPS: the field explains why, and the browser is never asked',
  { tags: ['acceptance', 'US-15', 'AT-4'] },
  () => {
    it('shows the HTTPS message and keeps "Use my location" disabled on an insecure page', async () => {
      setSecureContext(false)
      const getCurrentPosition = stubGeolocation(() => {})
      const fetchMock = vi.spyOn(globalThis, 'fetch')
      render(<CreateRoomForm cities={[]} />)

      const button = screen.getByRole('button', { name: 'Use my location' })
      expect(button).toBeDisabled()
      expect(screen.getByText(GEOLOCATION_MESSAGES.insecure)).toBeInTheDocument()
      expect(screen.getByLabelText('Location (optional)')).toHaveAccessibleDescription(
        GEOLOCATION_MESSAGES.insecure,
      )

      // Trying anyway does nothing: no position request and no API request.
      await userEvent.setup().click(button)
      expect(getCurrentPosition).not.toHaveBeenCalled()
      expect(fetchMock).not.toHaveBeenCalled()
    })
  },
)
