import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  confirmation,
  openDeleteConfirmation,
  renderRoomDetails,
  router,
  stubDeleteApi,
  twoLayouts,
} from './fixtures'

afterEach(() => {
  vi.restoreAllMocks()
  router.replace.mockReset()
  router.refresh.mockReset()
})

describe(
  'AT-2 — Confirmation: choosing delete asks first, and nothing is removed until I confirm',
  { tags: ['acceptance', 'US-05', 'AT-2'] },
  () => {
    it('opens a dialog that says the saved layouts go too, with focus inside, and sends nothing', async () => {
      const fetchMock = stubDeleteApi()
      const user = userEvent.setup()
      renderRoomDetails({ layouts: twoLayouts })

      await openDeleteConfirmation(user)

      const dialog = confirmation()
      expect(dialog).toBeInTheDocument()
      expect(dialog).toHaveAccessibleDescription(
        'This also deletes its 2 saved layouts. This cannot be undone.',
      )
      // Focus moves into the dialog, on the safe choice.
      expect(within(dialog!).getByRole('button', { name: 'Cancel' })).toHaveFocus()
      // Not removed yet: no request, still on the room page.
      expect(fetchMock).not.toHaveBeenCalled()
      expect(router.replace).not.toHaveBeenCalled()
    })

    it('only the Delete button in the dialog sends the DELETE request', async () => {
      const fetchMock = stubDeleteApi()
      const user = userEvent.setup()
      renderRoomDetails()

      await openDeleteConfirmation(user)
      expect(fetchMock).not.toHaveBeenCalled()

      await user.click(within(confirmation()!).getByRole('button', { name: 'Delete' }))
      expect(fetchMock).toHaveBeenCalledTimes(1)
      expect(fetchMock.mock.calls[0]![0]).toBe('/api/rooms/3')
      expect(fetchMock.mock.calls[0]![1]?.method).toBe('DELETE')
    })

    it('counts the saved layouts the page shows, after one was deleted on the page', async () => {
      stubDeleteApi()
      const user = userEvent.setup()
      renderRoomDetails({ layouts: twoLayouts })

      // Delete "Cosy corner" from the saved layouts list (US-14b), before the server list reloads.
      await user.click(screen.getByRole('button', { name: 'Delete Cosy corner' }))
      await user.click(screen.getByRole('button', { name: 'Delete' }))
      expect(screen.queryByRole('button', { name: 'Open Cosy corner' })).not.toBeInTheDocument()

      await openDeleteConfirmation(user)

      expect(confirmation()).toHaveAccessibleDescription(
        'This also deletes its saved layout. This cannot be undone.',
      )
    })
  },
)
