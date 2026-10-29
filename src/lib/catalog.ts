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

/** True when `value` is one of the known categories (used to validate ?category=). */
export function isItemCategory(value: string): value is ItemCategory {
  return (ITEM_CATEGORIES as readonly string[]).includes(value)
}

// pt-PT standard: space as thousands separator, comma for decimals, € after.
// useGrouping 'always': CLDR pt-PT skips the separator for 4-digit amounts
// (1234,56 €); 'always' makes every amount consistent (1 234,56 €).
const euro = new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR', useGrouping: 'always' })

/** Prices are stored as integer cents (no floating-point rounding); 34900 -> "349,00 €". */
export function formatPriceCents(priceCents: number): string {
  return euro.format(priceCents / 100)
}
