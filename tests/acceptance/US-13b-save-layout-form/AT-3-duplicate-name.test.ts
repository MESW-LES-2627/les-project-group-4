import { describe, expect, it } from 'vitest'

import { DUPLICATE_LAYOUT_NAME } from '@/features/rooms/schema'
import { describeSaveError } from '@/lib/saveLayout'

describe(
  'AT-3 — Duplicate name: "A layout with this name already exists" is shown next to the name',
  { tags: ['acceptance', 'US-13b', 'AT-3'] },
  () => {
    it('shows the 409 duplicate-name message next to the name field', () => {
      expect(
        describeSaveError({
          status: 409,
          message: DUPLICATE_LAYOUT_NAME,
          fieldErrors: { name: DUPLICATE_LAYOUT_NAME },
        }),
      ).toEqual({ nameError: DUPLICATE_LAYOUT_NAME })
    })
  },
)
