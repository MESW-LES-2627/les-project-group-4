import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  editForm,
  openEditForm,
  renderRoomDetails,
  retype,
  room,
  router,
  stubUpdateRoomApi,
} from './fixtures'

afterEach(() => {
  vi.restoreAllMocks()
  router.refresh.mockReset()
})

describe(
  'AT-3 — Persisted edit: saving sends the changes and the page shows the reloaded room',
  { tags: ['acceptance', 'US-04', 'AT-3'] },
  () => {
    it('sends PATCH with the new values, reloads the room and closes the form', async () => {
      const fetchMock = stubUpdateRoomApi()
      const user = userEvent.setup()
      const { rerenderRoom } = renderRoomDetails()

      await openEditForm(user)
      await retype(user, /room name/i, 'Guest room')
      await retype(user, /width/i, '280')
      await user.click(screen.getByRole('button', { name: 'Save changes' }))

      expect(fetchMock).toHaveBeenCalledTimes(1)
      expect(fetchMock.mock.calls[0]![0]).toBe('/api/rooms/3')
      expect(fetchMock.mock.calls[0]![1]?.method).toBe('PATCH')
      expect(JSON.parse(String(fetchMock.mock.calls[0]![1]?.body))).toEqual({
        name: 'Guest room',
        widthCm: 280,
        lengthCm: 400,
      })
      expect(router.refresh).toHaveBeenCalledTimes(1)
      expect(editForm()).not.toBeInTheDocument()

      // router.refresh() renders the page again with the room from the database.
      rerenderRoom({ ...room, name: 'Guest room', widthCm: 280 })
      expect(screen.getByRole('heading', { level: 1, name: 'Guest room' })).toBeInTheDocument()
      expect(screen.getByText('280 × 400 cm · 11.2 m²')).toBeInTheDocument()
    })

    it('keeps the form and shows the error when the save fails', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        Response.json({ message: 'Room not found.' }, { status: 404 }),
      )
      const user = userEvent.setup()
      renderRoomDetails()

      await openEditForm(user)
      await user.click(screen.getByRole('button', { name: 'Save changes' }))

      expect(await screen.findByText('Could not save the room')).toBeInTheDocument()
      expect(editForm()).toBeInTheDocument()
      expect(router.refresh).not.toHaveBeenCalled()
    })
  },
)
