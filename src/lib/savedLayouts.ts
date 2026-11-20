import type { ApiError, LayoutDetails, LayoutSummary } from '@/api/types'
import type { PlacedItem } from '@/lib/layout/layout'

/** US-14b AT-1: "1 item", "3 items". */
export function formatItemCount(count: number): string {
  return count === 1 ? '1 item' : `${count} items`
}

/**
 * US-14b AT-5: the layouts still to show once some were deleted on this page.
 * The list comes from the server, so a refresh after a save keeps the deleted ones hidden.
 */
export function visibleLayouts<T extends LayoutSummary>(
  layouts: readonly T[],
  deletedIds: ReadonlySet<number>,
): T[] {
  return layouts.filter((layout) => !deletedIds.has(layout.id))
}

/**
 * US-13b / US-14b: the name for the "Saved …" confirmation, or null once that layout
 * is no longer in the room's list (deleted after it was saved).
 */
export function savedConfirmation(
  saved: { id: number; name: string } | null,
  layouts: readonly LayoutSummary[],
): string | null {
  if (saved === null) return null
  return layouts.some((layout) => layout.id === saved.id) ? saved.name : null
}

/**
 * US-14b AT-5: whether a failed delete still means the layout is gone.
 * A 404 means another tab already deleted it, so it leaves the list like a successful delete.
 */
export function isAlreadyDeleted(error: ApiError): boolean {
  return error.status === 404
}

/**
 * US-14b AT-3: a saved layout as items for the plan, with the same positions and rotations.
 * The draft id is derived from the saved row, so it stays unique within the layout.
 */
export function toDraftItems(layout: LayoutDetails): PlacedItem[] {
  return layout.items.map((item) => ({
    id: `saved-${layout.id}-${item.id}`,
    catalogItemId: item.catalogItemId,
    name: item.name,
    widthCm: item.widthCm,
    depthCm: item.depthCm,
    priceCents: item.priceCents,
    xCm: item.xCm,
    yCm: item.yCm,
    rotationDeg: item.rotationDeg,
  }))
}

/**
 * US-14b AT-4: opening a layout replaces the plan, so ask first when the plan has items.
 * The draft does not track what was saved, so any item counts as work to keep.
 */
export function needsReplaceConfirmation(currentItems: readonly PlacedItem[]): boolean {
  return currentItems.length > 0
}

/** US-14b AT-6: the message for the not-found state. */
export const LAYOUT_NOT_FOUND_MESSAGE = 'This layout no longer exists. The plan was not changed.'

/**
 * US-14b AT-6: what to show when opening fails. A 404 means the layout is gone, so it also
 * leaves the list; anything else keeps it and shows the API message.
 */
export function describeOpenError(error: ApiError): { message: string; missing: boolean } {
  if (error.status === 404) {
    return { message: LAYOUT_NOT_FOUND_MESSAGE, missing: true }
  }
  return { message: error.message, missing: false }
}
