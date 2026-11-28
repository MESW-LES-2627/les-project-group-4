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

async function deleteTheRoom() {
  const user = userEvent.setup()
  await openDeleteConfirmation(user)
  await user.click(within(confirmation()!).getByRole('button', { name: 'Delete' }))
}

describe(
  'AT-4 — Deleted: after confirming, the user is back on the room list and nothing points at the room',
  { tags: ['acceptance', 'US-05', 'AT-4'] },
  () => {
    it('goes back to the room list, without a history entry for the deleted room', async () => {
      stubDeleteApi(204)
      renderRoomDetails()

      await deleteTheRoom()

      expect(router.replace).toHaveBeenCalledWith('/rooms')
    })

    it('drops the room\'s unsaved plan and the catalog\'s "add to" target, and keeps other rooms', async () => {
      stubDeleteApi(204)
      renderRoomDetails({ drafts: { 3: [sofa], 9: [sofa] }, currentRoomId: 3 })
      expect(draftState()).toBe('current:3 room3:1 room9:1')

      await deleteTheRoom()

      expect(draftState()).toBe('current:none room3:0 room9:1')
    })

    it('keeps the catalog target when it is another room', async () => {
      stubDeleteApi(204)
      renderRoomDetails({ currentRoomId: 9 })

      await deleteTheRoom()

      expect(draftState()).toBe('current:9 room3:0 room9:0')
    })

    it('also leaves when the room was already deleted elsewhere (404)', async () => {
      stubDeleteApi(404)
      renderRoomDetails({ drafts: { 3: [sofa] } })

      await deleteTheRoom()

      expect(router.replace).toHaveBeenCalledWith('/rooms')
      expect(draftState()).toBe('current:none room3:0 room9:0')
    })

    it('keeps the room, its plan and the dialog, with the error, when the delete fails', async () => {
      stubDeleteApi(500)
      renderRoomDetails({ drafts: { 3: [sofa] }, currentRoomId: 3 })

      await deleteTheRoom()

      // The API client turns any 5xx into its generic "server unavailable" message.
      expect(await within(confirmation()!).findByRole('alert')).toHaveTextContent(
        'Please try again later.',
      )
      expect(router.replace).not.toHaveBeenCalled()
      expect(draftState()).toBe('current:3 room3:1 room9:0')
      expect(within(confirmation()!).getByRole('button', { name: 'Delete' })).toBeEnabled()
      // The page behind the modal dialog is hidden from assistive tech, hence `hidden: true`.
      expect(screen.getByRole('heading', { level: 1, name: 'Bedroom', hidden: true })).toBeInTheDocument()
    })
  },
)
