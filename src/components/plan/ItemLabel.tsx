import { Html } from '@react-three/drei'

import type { PlacedItem } from '@/lib/layout/layout'

import { itemLabelText } from './label'

const BASE_CLASS =
  'whitespace-nowrap rounded border px-1.5 py-0.5 text-[10px] font-medium shadow-sm'

/**
 * DOM label attached to an item footprint.
 *
 * This component is deliberately kept out of RoomScene: the shared scene graph
 * must stay renderable without a DOM (test renderer)
 */
export function ItemLabel({
  item,
  selected,
}: {
  item: PlacedItem
  selected: boolean
}) {
  const tone = selected
    ? 'border-brand bg-brand text-brand-ink'
    : 'border-slate-300 bg-white/95 text-slate-700'

  return (
    <Html center zIndexRange={[20, 0]} style={{ pointerEvents: 'none' }}>
      <span className={`${BASE_CLASS} ${tone}`}>
        {itemLabelText(item, selected)}
      </span>
    </Html>
  )
}
