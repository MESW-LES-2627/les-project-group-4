import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { openEditForm, renderRoomDetails, retype, stubUpdateRoomApi } from './fixtures'

afterEach(() => {
  vi.restoreAllMocks()
})

describe(
  'AT-2 — Same validation as create: invalid values show the create-room errors and send nothing',
  { tags: ['acceptance', 'US-04', 'AT-2'] },
  () => {
    it('shows the create-room messages for a blank name and a non-positive dimension', async () => {
      const fetchMock = stubUpdateRoomApi()
      const user = userEvent.setup()
      renderRoomDetails()

      await openEditForm(user)
      await retype(user, /room name/i, '   ')
      await retype(user, /width/i, '0')
      await retype(user, /length/i, '-5')
      await user.click(screen.getByRole('button', { name: 'Save changes' }))

      // The same messages as the create-room form (US-01 AT-2).
      expect(screen.getByText('Name is required')).toBeInTheDocument()
      expect(screen.getByText('Width must be greater than 0')).toBeInTheDocument()
      expect(screen.getByText('Length must be a positive whole number')).toBeInTheDocument()
      expect(screen.getByLabelText(/room name/i)).toHaveFocus()
      expect(fetchMock).not.toHaveBeenCalled()
    })
  },
)
