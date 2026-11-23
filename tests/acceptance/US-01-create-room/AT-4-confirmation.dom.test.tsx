import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { CreateRoomForm } from '@/features/rooms/components/CreateRoomForm'
import type { Room } from '@/features/rooms/types'

// What POST /api/rooms answers with 201 Created for the values typed below.
const createdRoom: Room = {
  id: 42,
  name: 'Bedroom',
  widthCm: 300,
  lengthCm: 400,
  city: null,
  latitude: null,
  longitude: null,
}

/** Replaces the browser's fetch, so the form talks to a fake API instead of a server. */
function mockCreateRoomResponse(response: Response) {
  return vi.spyOn(globalThis, 'fetch').mockResolvedValue(response)
}

/** Types a valid room and presses "Create room", as a user would. */
async function fillAndSubmit() {
  const user = userEvent.setup()
  await user.type(screen.getByLabelText(/room name/i), 'Bedroom')
  await user.type(screen.getByLabelText(/width/i), '300')
  await user.type(screen.getByLabelText(/length/i), '400')
  await user.click(screen.getByRole('button', { name: 'Create room' }))
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe(
  'AT-4 — Confirmation: the created room is confirmed, and a failed request keeps the form',
  { tags: ['acceptance', 'US-01', 'AT-4'] },
  () => {
    it('shows the confirmation with the created room values after a valid submit', async () => {
      const fetchMock = mockCreateRoomResponse(Response.json(createdRoom, { status: 201 }))
      render(<CreateRoomForm cities={[]} />)

      await fillAndSubmit()

      expect(await screen.findByRole('heading', { name: 'Room created' })).toBeInTheDocument()
      expect(screen.getByText('Bedroom')).toBeInTheDocument()
      expect(screen.getByText(/300 × 400 cm/)).toBeInTheDocument()
      expect(screen.getByRole('link', { name: 'View room' })).toHaveAttribute('href', '/rooms/42')

      // The request carried the typed values (no location was chosen).
      expect(fetchMock).toHaveBeenCalledTimes(1)
      const [url, init] = fetchMock.mock.calls[0]!
      expect(url).toBe('/api/rooms')
      expect(JSON.parse(String(init?.body))).toEqual({ name: 'Bedroom', widthCm: 300, lengthCm: 400 })
    })

    it('shows the API error and keeps the entered values when the request fails', async () => {
      mockCreateRoomResponse(Response.json({ message: 'boom' }, { status: 500 }))
      render(<CreateRoomForm cities={[]} />)

      await fillAndSubmit()

      expect(await screen.findByText('Could not create room')).toBeInTheDocument()
      expect(
        screen.getByText('The server is unavailable right now. Please try again later.'),
      ).toBeInTheDocument()
      expect(screen.queryByRole('heading', { name: 'Room created' })).not.toBeInTheDocument()
      expect(screen.getByLabelText(/room name/i)).toHaveValue('Bedroom')
      expect(screen.getByLabelText(/width/i)).toHaveValue('300')
      expect(screen.getByLabelText(/length/i)).toHaveValue('400')
      // The form stays usable: the user can try again.
      expect(screen.getByRole('button', { name: 'Create room' })).toBeEnabled()
    })
  },
)
