import { describe, expect, it } from 'vitest'

import type { PlacedItem } from '@/features/plan/model/layout'
import { needsReplaceConfirmation } from '@/features/rooms/model/savedLayouts'

const desk: PlacedItem = {
  id: 'draft-1',
  catalogItemId: 5,
  name: 'Desk',
  widthCm: 120,
  depthCm: 60,
  priceCents: 19900,
  xCm: 60,
  yCm: 30,
  rotationDeg: 0,
}

// The Replace/Cancel buttons are UI (no component test harness yet, #66 CH-05);
// cancelling only closes the prompt, so the plan is never touched.
describe(
  'AT-4 — Confirm replace: opening over a plan with items asks first',
  { tags: ['acceptance', 'US-14b', 'AT-4'] },
  () => {
    it('asks for confirmation when the plan has items', () => {
      expect(needsReplaceConfirmation([desk])).toBe(true)
    })

    it('opens straight away when the plan is empty', () => {
      expect(needsReplaceConfirmation([])).toBe(false)
    })
  },
)
