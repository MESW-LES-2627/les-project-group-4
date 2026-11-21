/** One catalog item, as returned by GET /api/items (US-07). Sizes in cm, price in euro cents. */
export interface CatalogItem {
  id: number
  slug: string
  name: string
  category: string
  widthCm: number
  depthCm: number
  heightCm: number | null
  priceCents: number
  styleTags: string[]
  roomTypeTags: string[]
}
