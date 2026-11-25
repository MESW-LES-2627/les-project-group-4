import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  editForm,
  openEditForm,
  renderRoomDetails,
  retype,
  router,
  sofa,
  stubUpdateRoomApi,
} from './fixtures'

afterEach(() => {
  vi.restoreAllMocks()
  router.refresh.mockReset()
})

const warning = '1 placed item would be outside the room with these dimensions (Sofa).'

describe(
  'AT-4 — Smaller-than-items warning: shrinking below a placed item warns before saving',
  { tags: ['acceptance', 'US-04', 'AT-4'] },
  () => {
    it('warns and sends nothing until "Save anyway"', async () => {
      const fetchMock = stubUpdateRoomApi()
      const user = userEvent.setup()
      renderRoomDetails({ placedItems: [sofa] })

      await openEditForm(user)
      await retype(user, /width/i, '150') // the sofa is 200 cm wide
      await user.click(screen.getByRole('button', { name: 'Save changes' }))

      expect(screen.getByText(warning, { exact: false })).toBeInTheDocument()
      expect(fetchMock).not.toHaveBeenCalled()

      await user.click(screen.getByRole('button', { name: 'Save anyway' }))

      expect(fetchMock).toHaveBeenCalledTimes(1)
      expect(JSON.parse(String(fetchMock.mock.calls[0]![1]?.body))).toMatchObject({ widthCm: 150 })
      expect(router.refresh).toHaveBeenCalledTimes(1)
      expect(editForm()).not.toBeInTheDocument()
    })

    it('"Change dimensions" goes back to the form without saving', async () => {
      const fetchMock = stubUpdateRoomApi()
      const user = userEvent.setup()
      renderRoomDetails({ placedItems: [sofa] })

      await openEditForm(user)
      await retype(user, /width/i, '150')
      await user.click(screen.getByRole('button', { name: 'Save changes' }))
      await user.click(screen.getByRole('button', { name: 'Change dimensions' }))

      expect(screen.queryByText(warning, { exact: false })).not.toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Save changes' })).toBeInTheDocument()
      expect(fetchMock).not.toHaveBeenCalled()
    })

    it('saves without a warning when every placed item still fits', async () => {
      const fetchMock = stubUpdateRoomApi()
      const user = userEvent.setup()
      renderRoomDetails({ placedItems: [sofa] })

      await openEditForm(user)
      await retype(user, /width/i, '250')
      await user.click(screen.getByRole('button', { name: 'Save changes' }))

      expect(screen.queryByText(warning, { exact: false })).not.toBeInTheDocument()
      expect(fetchMock).toHaveBeenCalledTimes(1)
    })
  },
)
