import type { PlacedItem } from '@/features/plan/model/layout'

/**
 * US-10: read-only caption for the selected item. Rotation is performed inside
 * the plan by clicking the selected item again without moving.
 */
export function SelectedItemControls({ item }: { item: PlacedItem }) {
  return (
    <span>
      Selected: {item.name} · {item.widthCm} × {item.depthCm} cm ·{' '}
      {Math.round(item.rotationDeg)}° — click again to rotate
    </span>
  )
}
