// CH-02: sample catalog and cities for development, staging and demos.
// Every row has a stable `slug`: the seed upserts by slug, so running it again
// updates rows in place and never duplicates them or breaks saved layouts.
// All retailers and items are fictional SAMPLE DATA (the UI labels them as such).
// Physical stores are NOT seeded: they arrive with US-17 in Iteration 4 and are
// linked to items through `source`.

import type { ItemCategory } from '../../src/features/catalog/model/catalog'

/** Fictional retailers. A retailer can have many physical shops (added in Iteration 4). */
export const SAMPLE_SOURCES = ['sample-nordic-home', 'sample-casa-moderna', 'sample-atelier-classico'] as const
export type SampleSource = (typeof SAMPLE_SOURCES)[number]

const urlFor = (source: SampleSource, slug: string) => `https://example.com/${source}/${slug}`

export interface SeedCity {
  slug: string
  name: string
  /** ISO 3166-1 alpha-2 country code. */
  country: string
  latitude: number
  longitude: number
}

export interface SeedItem {
  slug: string
  name: string
  category: ItemCategory
  widthCm: number
  depthCm: number
  heightCm: number
  /** Integer cents: 34900 = 349,00 €. */
  priceCents: number
  styleTags: string[]
  roomTypeTags: string[]
  /** Key of the (fictional) retailer that sells the item. Iteration 4 links Store rows by it. */
  source: SampleSource
  /** Product page at that retailer. example.com is reserved, so no real shop is implied. */
  sourceUrl: string
}

export const SEED_CITIES: SeedCity[] = [
  { slug: 'porto', name: 'Porto', country: 'PT', latitude: 41.1579, longitude: -8.6291 },
  { slug: 'lisboa', name: 'Lisboa', country: 'PT', latitude: 38.7223, longitude: -9.1393 },
  { slug: 'braga', name: 'Braga', country: 'PT', latitude: 41.5454, longitude: -8.4265 },
  { slug: 'coimbra', name: 'Coimbra', country: 'PT', latitude: 40.2033, longitude: -8.4103 },
  { slug: 'aveiro', name: 'Aveiro', country: 'PT', latitude: 40.6405, longitude: -8.6538 },
  { slug: 'faro', name: 'Faro', country: 'PT', latitude: 37.0194, longitude: -7.9322 },
]

export const SEED_ITEMS: SeedItem[] = [
  { slug: 'sofa-nordic-3-seat', name: 'Nordic 3-seat sofa', category: 'sofa', widthCm: 210, depthCm: 90, heightCm: 80, priceCents: 49900, styleTags: ['nordic'], roomTypeTags: ['living-room'], source: 'sample-nordic-home', sourceUrl: urlFor('sample-nordic-home', 'sofa-nordic-3-seat') },
  { slug: 'sofa-compact-2-seat', name: 'Compact 2-seat sofa', category: 'sofa', widthCm: 150, depthCm: 82, heightCm: 78, priceCents: 32900, styleTags: ['modern'], roomTypeTags: ['living-room', 'office'], source: 'sample-casa-moderna', sourceUrl: urlFor('sample-casa-moderna', 'sofa-compact-2-seat') },
  { slug: 'armchair-reading', name: 'Reading armchair', category: 'armchair', widthCm: 80, depthCm: 85, heightCm: 95, priceCents: 19900, styleTags: ['classic'], roomTypeTags: ['living-room', 'bedroom'], source: 'sample-atelier-classico', sourceUrl: urlFor('sample-atelier-classico', 'armchair-reading') },
  { slug: 'armchair-rattan', name: 'Rattan armchair', category: 'armchair', widthCm: 75, depthCm: 72, heightCm: 82, priceCents: 14900, styleTags: ['boho'], roomTypeTags: ['living-room'], source: 'sample-atelier-classico', sourceUrl: urlFor('sample-atelier-classico', 'armchair-rattan') },
  { slug: 'bed-double-oak', name: 'Double bed, oak', category: 'bed', widthCm: 160, depthCm: 205, heightCm: 95, priceCents: 44900, styleTags: ['nordic'], roomTypeTags: ['bedroom'], source: 'sample-nordic-home', sourceUrl: urlFor('sample-nordic-home', 'bed-double-oak') },
  { slug: 'bed-single-white', name: 'Single bed, white', category: 'bed', widthCm: 90, depthCm: 200, heightCm: 85, priceCents: 21900, styleTags: ['modern'], roomTypeTags: ['bedroom'], source: 'sample-casa-moderna', sourceUrl: urlFor('sample-casa-moderna', 'bed-single-white') },
  { slug: 'table-dining-6', name: 'Dining table for 6', category: 'table', widthCm: 180, depthCm: 90, heightCm: 75, priceCents: 39900, styleTags: ['industrial'], roomTypeTags: ['dining-room'], source: 'sample-casa-moderna', sourceUrl: urlFor('sample-casa-moderna', 'table-dining-6') },
  { slug: 'table-coffee-round', name: 'Round coffee table', category: 'table', widthCm: 80, depthCm: 80, heightCm: 40, priceCents: 8900, styleTags: ['nordic'], roomTypeTags: ['living-room'], source: 'sample-nordic-home', sourceUrl: urlFor('sample-nordic-home', 'table-coffee-round') },
  { slug: 'chair-dining-wood', name: 'Wooden dining chair', category: 'chair', widthCm: 45, depthCm: 52, heightCm: 82, priceCents: 5900, styleTags: ['nordic'], roomTypeTags: ['dining-room', 'kitchen'], source: 'sample-nordic-home', sourceUrl: urlFor('sample-nordic-home', 'chair-dining-wood') },
  { slug: 'chair-office-ergonomic', name: 'Ergonomic office chair', category: 'chair', widthCm: 65, depthCm: 65, heightCm: 115, priceCents: 17900, styleTags: ['modern'], roomTypeTags: ['office'], source: 'sample-casa-moderna', sourceUrl: urlFor('sample-casa-moderna', 'chair-office-ergonomic') },
  { slug: 'desk-standing', name: 'Standing desk', category: 'desk', widthCm: 140, depthCm: 70, heightCm: 120, priceCents: 29900, styleTags: ['modern'], roomTypeTags: ['office'], source: 'sample-casa-moderna', sourceUrl: urlFor('sample-casa-moderna', 'desk-standing') },
  { slug: 'desk-compact-writing', name: 'Compact writing desk', category: 'desk', widthCm: 100, depthCm: 50, heightCm: 75, priceCents: 12900, styleTags: ['nordic'], roomTypeTags: ['bedroom', 'office'], source: 'sample-nordic-home', sourceUrl: urlFor('sample-nordic-home', 'desk-compact-writing') },
  { slug: 'storage-wardrobe-2-door', name: '2-door wardrobe', category: 'storage', widthCm: 100, depthCm: 60, heightCm: 200, priceCents: 27900, styleTags: ['modern'], roomTypeTags: ['bedroom'], source: 'sample-casa-moderna', sourceUrl: urlFor('sample-casa-moderna', 'storage-wardrobe-2-door') },
  { slug: 'storage-bookcase-5-shelf', name: '5-shelf bookcase', category: 'storage', widthCm: 80, depthCm: 30, heightCm: 180, priceCents: 9900, styleTags: ['industrial'], roomTypeTags: ['living-room', 'office'], source: 'sample-casa-moderna', sourceUrl: urlFor('sample-casa-moderna', 'storage-bookcase-5-shelf') },
  { slug: 'lighting-floor-lamp', name: 'Arc floor lamp', category: 'lighting', widthCm: 40, depthCm: 40, heightCm: 180, priceCents: 7900, styleTags: ['modern'], roomTypeTags: ['living-room'], source: 'sample-casa-moderna', sourceUrl: urlFor('sample-casa-moderna', 'lighting-floor-lamp') },
  { slug: 'lighting-bedside-lamp', name: 'Bedside table lamp', category: 'lighting', widthCm: 25, depthCm: 25, heightCm: 45, priceCents: 2900, styleTags: ['nordic'], roomTypeTags: ['bedroom'], source: 'sample-nordic-home', sourceUrl: urlFor('sample-nordic-home', 'lighting-bedside-lamp') },
]
