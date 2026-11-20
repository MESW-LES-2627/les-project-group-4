import type { PlacedItem } from '@/lib/layout/layout'

import { itemLabelText } from './label'

const BASE_CLASS =
  'whitespace-nowrap rounded border px-1.5 py-0.5 text-[10px] font-medium shadow-sm'

/**
 * One item's label. Positioning is handled by the ItemLabels overlay, so this
 * stays a plain span instead of drei's Html (which only renders the last of
 * several instances).
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

  return <span className={`${BASE_CLASS} ${tone}`}>{itemLabelText(item, selected)}</span>
}
