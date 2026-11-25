import { isInsideRoom, type Placement, type RoomSize, type Size } from '@/features/plan/model/geometry'

type Footprint = Size & Placement & { name: string }

/** US-04 AT-4: what new dimensions would leave outside the room. Nothing is moved. */
export interface OutsideReport {
  /** Items of the room's current (unsaved) plan that would be partly or fully outside. */
  placed: string[]
  /** Saved layouts with at least one item that would be outside. */
  layouts: string[]
}

function outside<T extends Footprint>(items: readonly T[], room: RoomSize): T[] {
  return items.filter((item) => !isInsideRoom(item, item, room))
}

/**
 * US-04 AT-4: the placed items, in the current plan and in the saved layouts, that would end
 * up outside the room with the new dimensions. Items stay where they are; the plan then shows
 * them out of bounds (US-11b).
 */
export function findItemsOutside(
  placed: readonly Footprint[],
  layouts: readonly { name: string; items: readonly Footprint[] }[],
  room: RoomSize,
): OutsideReport {
  return {
    placed: outside(placed, room).map((item) => item.name),
    layouts: layouts
      .filter((layout) => outside(layout.items, room).length > 0)
      .map((layout) => layout.name),
  }
}

export function hasItemsOutside(report: OutsideReport): boolean {
  return report.placed.length > 0 || report.layouts.length > 0
}

/** "Sofa, Lamp, Rug and 2 more": at most three names, each name once. */
function listNames(names: readonly string[]): string {
  const unique = [...new Set(names)]
  return unique.length <= 3
    ? unique.join(', ')
    : `${unique.slice(0, 3).join(', ')} and ${unique.length - 3} more`
}

/** US-04 AT-4: the warning shown before the smaller dimensions are saved, one sentence per part. */
export function describeItemsOutside(report: OutsideReport): string[] {
  const lines: string[] = []
  if (report.placed.length > 0) {
    const subject =
      report.placed.length === 1 ? '1 placed item' : `${report.placed.length} placed items`
    lines.push(`${subject} would be outside the room (${listNames(report.placed)}).`)
  }
  if (report.layouts.length > 0) {
    const subject =
      report.layouts.length === 1
        ? '1 saved layout has'
        : `${report.layouts.length} saved layouts have`
    lines.push(`${subject} items that would be outside (${listNames(report.layouts)}).`)
  }
  return lines
}
