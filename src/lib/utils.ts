export { cn } from "cn"

// pt-PT standard: space as thousands separator, comma for decimals, € after.
// useGrouping 'always': CLDR pt-PT skips the separator for 4-digit amounts
// (1234,56 €); 'always' makes every amount consistent (1 234,56 €).
const euro = new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR', useGrouping: 'always' })

/** Prices are stored as integer cents (no floating-point rounding); 34900 -> "349,00 €". */
export function formatPriceCents(priceCents: number): string {
  return euro.format(priceCents / 100)
}
