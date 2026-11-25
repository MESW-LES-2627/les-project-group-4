import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { PlacedItemsList } from '@/features/plan/components/PlacedItemsList'
import { toPlacedItem } from '@/features/plan/model/layout'

import { lamp, sofa } from './fixtures'

// Promised on #86: once the harness exists, check the Total row as the user sees it.
// The helper tests (AT-1-total.test.ts) check the sum; this checks what is rendered.
const placed = [
  toPlacedItem(sofa, 'a', { xCm: 150, yCm: 100, rotationDeg: 0 }),
  toPlacedItem(lamp, 'b', { xCm: 400, yCm: 100, rotationDeg: 0 }),
]

describe(
  'AT-1 — Total: the placed items list shows the total of the stored prices',
  { tags: ['acceptance', 'US-12', 'AT-1'] },
  () => {
    it('shows a Total row of 528,00 € for the sofa (499,00 €) and the lamp (29,00 €)', () => {
      render(<PlacedItemsList items={placed} />)

      const rows = screen.getByRole('list', { name: 'Placed items' })
      expect(rows).toHaveTextContent('499,00 €')
      expect(rows).toHaveTextContent('29,00 €')
      // The Total row sits under the list: the label and the amount are two spans of one row.
      // toHaveTextContent treats the no-break space that Intl puts before € as a space.
      const totalRow = screen.getByText('Total').parentElement
      expect(totalRow).toHaveTextContent(/^Total\s*528,00 €$/)
      expect(totalRow).toHaveAttribute('aria-live', 'polite')
    })

    it('has no Total row when no items are placed', () => {
      render(<PlacedItemsList items={[]} />)

      expect(screen.getByText('No items placed in this room yet.')).toBeInTheDocument()
      expect(screen.queryByText('Total')).not.toBeInTheDocument()
    })
  },
)
