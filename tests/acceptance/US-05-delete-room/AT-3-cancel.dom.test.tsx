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
  'AT-3 — Cancel: cancelling the confirmation leaves the room unchanged',
  { tags: ['acceptance', 'US-05', 'AT-3'] },
  () => {
    it('closes the confirmation, sends nothing and stays on the room', async () => {
      const fetchMock = stubDeleteRoomApi()
      const user = userEvent.setup()
      renderRoomDetails()

      await openDeleteConfirmation(user)
      await user.click(within(confirmation()!).getByRole('button', { name: 'Cancel' }))

      expect(confirmation()).not.toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Delete room' })).toBeEnabled()
      expect(screen.getByRole('heading', { level: 1, name: 'Bedroom' })).toBeInTheDocument()
      expect(fetchMock).not.toHaveBeenCalled()
      expect(router.replace).not.toHaveBeenCalled()
    })
  },
)
