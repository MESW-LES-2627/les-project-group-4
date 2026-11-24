import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  confirmation,
  openDeleteConfirmation,
  renderRoomDetails,
  router,
  stubDeleteRoomApi,
} from './fixtures'

afterEach(() => {
  vi.restoreAllMocks()
  router.replace.mockReset()
})

describe(
  'AT-4 — Deleted: after confirming, the user is back on the room list',
  { tags: ['acceptance', 'US-05', 'AT-4'] },
  () => {
    it('goes back to the room list, without a history entry for the deleted room', async () => {
      stubDeleteRoomApi(204)
      const user = userEvent.setup()
      renderRoomDetails()

      await openDeleteConfirmation(user)
      await user.click(within(confirmation()!).getByRole('button', { name: 'Delete' }))

      expect(router.replace).toHaveBeenCalledWith('/rooms')
    })

    it('also goes to the list when the room was already deleted elsewhere (404)', async () => {
      stubDeleteRoomApi(404)
      const user = userEvent.setup()
      renderRoomDetails()

      await openDeleteConfirmation(user)
      await user.click(within(confirmation()!).getByRole('button', { name: 'Delete' }))

      expect(router.replace).toHaveBeenCalledWith('/rooms')
    })

    it('keeps the room and shows the error when the delete fails', async () => {
      stubDeleteRoomApi(500)
      const user = userEvent.setup()
      renderRoomDetails()

      await openDeleteConfirmation(user)
      await user.click(within(confirmation()!).getByRole('button', { name: 'Delete' }))

      // The API client turns any 5xx into its generic "server unavailable" message.
      expect(await screen.findByRole('alert')).toHaveTextContent('Please try again later.')
      expect(router.replace).not.toHaveBeenCalled()
      expect(screen.getByRole('heading', { level: 1, name: 'Bedroom' })).toBeInTheDocument()
      expect(within(confirmation()!).getByRole('button', { name: 'Delete' })).toBeEnabled()
    })
  },
)
