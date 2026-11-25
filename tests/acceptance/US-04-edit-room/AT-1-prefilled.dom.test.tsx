import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { editForm, openEditForm, renderRoomDetails } from './fixtures'

afterEach(() => {
  vi.restoreAllMocks()
})

describe(
  'AT-1 — Pre-filled form: the edit form starts with the current name and dimensions',
  { tags: ['acceptance', 'US-04', 'AT-1'] },
  () => {
    it('opens a dialog from "Edit room" with name, width and length filled in', async () => {
      const user = userEvent.setup()
      renderRoomDetails()
      expect(editForm()).not.toBeInTheDocument()

      await openEditForm(user)

      expect(editForm()).toBeInTheDocument()
      expect(screen.getByLabelText(/room name/i)).toHaveValue('Bedroom')
      expect(screen.getByLabelText(/width/i)).toHaveValue('300')
      expect(screen.getByLabelText(/length/i)).toHaveValue('400')
      // Focus goes into the form, on the first field.
      expect(screen.getByLabelText(/room name/i)).toHaveFocus()
    })

    it('Cancel closes the form without sending anything', async () => {
      const fetchMock = vi.spyOn(globalThis, 'fetch')
      const user = userEvent.setup()
      renderRoomDetails()

      await openEditForm(user)
      await user.click(screen.getByRole('button', { name: 'Cancel' }))

      expect(editForm()).not.toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Edit room' })).toHaveFocus()
      expect(fetchMock).not.toHaveBeenCalled()
    })
  },
)
