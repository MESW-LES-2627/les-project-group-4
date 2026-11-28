import { screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { confirmation, renderRoomDetails } from './fixtures'

afterEach(() => {
  vi.restoreAllMocks()
})

describe(
  'AT-1 — Delete action: the room details view offers a delete action',
  { tags: ['acceptance', 'US-05', 'AT-1'] },
  () => {
    it('shows a "Delete room" button on the room page, with no confirmation open yet', () => {
      renderRoomDetails()

      expect(screen.getByRole('heading', { level: 1, name: 'Bedroom' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Delete room' })).toBeEnabled()
      expect(confirmation()).not.toBeInTheDocument()
    })
  },
)
