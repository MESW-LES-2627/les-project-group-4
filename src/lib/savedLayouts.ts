import type { ApiError, LayoutSummary } from '@/api/types'

/** US-14b AT-1: "1 item", "3 items". */
export function formatItemCount(count: number): string {
  return count === 1 ? '1 item' : `${count} items`
}

/**
 * US-14b AT-5: the layouts still to show once some were deleted on this page.
 * The list comes from the server, so a refresh after a save keeps the deleted ones hidden.
 */
export function visibleLayouts(
  layouts: readonly LayoutSummary[],
  deletedIds: ReadonlySet<number>,
): LayoutSummary[] {
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
