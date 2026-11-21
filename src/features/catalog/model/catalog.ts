// Shared catalog definitions (US-07, CH-02).
// One list of categories used by the seed, the items API and the catalog UI,
// so a category can never exist in one place and be missing in another.

export const ITEM_CATEGORIES = [
  'sofa',
  'armchair',
  'bed',
  'table',
  'chair',
  'desk',
  'storage',
  'lighting',
] as const

export type ItemCategory = (typeof ITEM_CATEGORIES)[number]

/** Human-readable label for each category, shown in the catalog UI. */
export const CATEGORY_LABELS: Record<ItemCategory, string> = {
  sofa: 'Sofas',
  armchair: 'Armchairs',
  bed: 'Beds',
  table: 'Tables',
  chair: 'Chairs',
  desk: 'Desks',
  storage: 'Storage',
  lighting: 'Lighting',
}
