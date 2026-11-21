/**
 * The part of a catalog item the plan needs. Structural on purpose: the plan
 * feature must not depend on the catalog feature.
 */
export interface PlacedItemSource {
  id: number
  name: string
  widthCm: number
  depthCm: number
  priceCents: number
}

/** The last room opened in this session: where the catalog adds items. */
export interface CurrentRoom {
  id: number
  name: string
  widthCm: number
  lengthCm: number
}
