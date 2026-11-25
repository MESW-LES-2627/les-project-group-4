import { isInsideRoom, type RoomSize } from '@/features/plan/model/geometry'
import type { PlacedItem } from '@/features/plan/model/layout'

/**
 * US-04 AT-4: the placed items that would end up partly or fully outside the room
 * with the new dimensions. Items stay where they are; the plan then shows them as
 * out of bounds (US-11).
 */
export function itemsOutsideRoom(items: readonly PlacedItem[], room: RoomSize): PlacedItem[] {
  return items.filter((item) => !isInsideRoom(item, item, room))
}

/** US-04 AT-4: the warning shown before smaller dimensions are saved. */
export function describeItemsOutside(items: readonly PlacedItem[]): string {
  const names = [...new Set(items.map((item) => item.name))]
  const listed = names.length <= 3 ? names.join(', ') : `${names.slice(0, 3).join(', ')} and ${names.length - 3} more`
  const subject = items.length === 1 ? '1 placed item' : `${items.length} placed items`
  return `${subject} would be outside the room with these dimensions (${listed}).`
}
