import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  confirmation,
  draftState,
  openDeleteConfirmation,
  renderRoomDetails,
  router,
  sofa,
  stubDeleteApi,
} from './fixtures'

afterEach(() => {
  vi.restoreAllMocks()
  router.replace.mockReset()
})

describe(
  'AT-3 — Cancel: cancelling the confirmation leaves the room unchanged',
  { tags: ['acceptance', 'US-05', 'AT-3'] },
  () => {
    it('Cancel closes the dialog, sends nothing, keeps the plan and gives focus back', async () => {
      const fetchMock = stubDeleteApi()
      const user = userEvent.setup()
      renderRoomDetails({ drafts: { 3: [sofa] }, currentRoomId: 3 })

      await openDeleteConfirmation(user)
      await user.click(within(confirmation()!).getByRole('button', { name: 'Cancel' }))

      expect(confirmation()).not.toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Delete room' })).toHaveFocus()
      expect(screen.getByRole('heading', { level: 1, name: 'Bedroom' })).toBeInTheDocument()
      expect(draftState()).toBe('current:3 room3:1 room9:0')
      expect(fetchMock).not.toHaveBeenCalled()
      expect(router.replace).not.toHaveBeenCalled()
    })

    it('Escape cancels too', async () => {
      const fetchMock = stubDeleteApi()
      const user = userEvent.setup()
      renderRoomDetails()

      await openDeleteConfirmation(user)
      await user.keyboard('{Escape}')

      expect(confirmation()).not.toBeInTheDocument()
      expect(fetchMock).not.toHaveBeenCalled()
    })
  },
)
