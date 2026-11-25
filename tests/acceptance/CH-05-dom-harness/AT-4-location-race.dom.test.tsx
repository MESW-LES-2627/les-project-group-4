import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { act } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { CreateRoomForm } from '@/features/rooms/components/CreateRoomForm'
import type { Room } from '@/features/rooms/types'

import {
  resetBrowserStubs,
  setSecureContext,
  stubGeolocation,
} from '../US-15-set-my-location/fixtures'

const createdRoom: Room = {
  id: 7,
  name: 'Office',
  widthCm: 250,
  lengthCm: 300,
  city: null,
  latitude: 41.1579,
  longitude: -8.6291,
}

afterEach(() => {
  resetBrowserStubs()
  vi.restoreAllMocks()
})

describe(
  'AT-4 — Location race: submit is blocked while the browser is still locating',
  { tags: ['acceptance', 'CH-05', 'AT-4'] },
  () => {
    it('sends nothing until the position arrives, then sends the coordinates', async () => {
      setSecureContext(true)
      // Keep the geolocation request pending: the answer is sent later by the test.
      let answer: PositionCallback = () => {}
      stubGeolocation((success) => {
        answer = success
      })
      const fetchMock = vi
        .spyOn(globalThis, 'fetch')
        .mockResolvedValue(Response.json(createdRoom, { status: 201 }))
      const user = userEvent.setup()
      render(<CreateRoomForm cities={[]} />)

      await user.type(screen.getByLabelText(/room name/i), 'Office')
      await user.type(screen.getByLabelText(/width/i), '250')
      await user.type(screen.getByLabelText(/length/i), '300')
      await user.click(screen.getByRole('button', { name: 'Use my location' }))

      // Still locating: the submit button is disabled, and Enter in a field sends nothing.
      const submit = screen.getByRole('button', { name: 'Create room' })
      expect(submit).toBeDisabled()
      await user.click(submit)
      await user.type(screen.getByLabelText(/room name/i), '{Enter}')
      expect(fetchMock).not.toHaveBeenCalled()

      // The browser answers: the form can be submitted, with the coordinates.
      act(() => {
        answer({
          coords: { latitude: 41.1579, longitude: -8.6291, accuracy: 20 },
          timestamp: 0,
        } as GeolocationPosition)
      })
      expect(submit).toBeEnabled()
      await user.click(submit)

      expect(await screen.findByRole('heading', { name: 'Room created' })).toBeInTheDocument()
      expect(fetchMock).toHaveBeenCalledTimes(1)
      expect(JSON.parse(String(fetchMock.mock.calls[0]![1]?.body))).toEqual({
        name: 'Office',
        widthCm: 250,
        lengthCm: 300,
        latitude: 41.1579,
        longitude: -8.6291,
      })
    })
  },
)
