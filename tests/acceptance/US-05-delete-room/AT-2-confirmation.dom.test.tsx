import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  confirmation,
  openDeleteConfirmation,
  renderRoomDetails,
  router,
  stubDeleteRoomApi,
  twoLayouts,
} from './fixtures'

afterEach(() => {
  vi.restoreAllMocks()
  router.replace.mockReset()
})

describe(
  'AT-2 — Confirmation: choosing delete asks first, and nothing is removed until I confirm',
  { tags: ['acceptance', 'US-05', 'AT-2'] },
  () => {
    it('asks for confirmation, says the saved layouts go too, and sends no request yet', async () => {
      const fetchMock = stubDeleteRoomApi()
      const user = userEvent.setup()
      renderRoomDetails(twoLayouts)

      await openDeleteConfirmation(user)

      const dialog = confirmation()
      expect(dialog).toBeInTheDocument()
      expect(dialog).toHaveTextContent('This also deletes its 2 saved layouts. This cannot be undone.')
      expect(within(dialog!).getByRole('button', { name: 'Delete' })).toBeEnabled()
      expect(within(dialog!).getByRole('button', { name: 'Cancel' })).toBeEnabled()
      // Not removed yet: no request, still on the room page.
      expect(fetchMock).not.toHaveBeenCalled()
      expect(router.replace).not.toHaveBeenCalled()
      expect(screen.getByRole('heading', { level: 1, name: 'Bedroom' })).toBeInTheDocument()
    })

    it('only the confirm button sends the DELETE request', async () => {
      const fetchMock = stubDeleteRoomApi()
      const user = userEvent.setup()
      renderRoomDetails()

      await openDeleteConfirmation(user)
      expect(fetchMock).not.toHaveBeenCalled()

      await user.click(within(confirmation()!).getByRole('button', { name: 'Delete' }))
      expect(fetchMock).toHaveBeenCalledTimes(1)
      expect(fetchMock.mock.calls[0]![0]).toBe('/api/rooms/3')
      expect(fetchMock.mock.calls[0]![1]?.method).toBe('DELETE')
    })
  },
)
