import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { AddToLayoutButton } from '@/components/catalog/AddToLayoutButton'
import { CatalogList } from '@/components/catalog/CatalogList'
import { CategoryFilter } from '@/components/catalog/CategoryFilter'
import { CurrentRoomBanner } from '@/components/catalog/CurrentRoomBanner'
import { PlacementError } from '@/components/catalog/PlacementError'
import { findItems } from '@/lib/items'
import { listItemsQuerySchema } from '@/lib/schemas/item'

export const metadata: Metadata = {
  title: 'FurniMi - Catalog',
}

/**
 * US-07: loads the catalog on the server, filtered by ?category=. An unknown category shows
 * not-found.tsx; loading.tsx and error.tsx cover the other states.
 */
export default async function CatalogPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  // Reading searchParams makes the page render on every request, so the list is always current.
  const { category } = await searchParams
  const parsed = listItemsQuerySchema.safeParse({ category })
  if (!parsed.success) {
    notFound()
  }

  const items = await findItems(parsed.data.category)

  return (
    <main className="flex flex-1 px-4 py-8 sm:px-8 sm:py-12">
      <section
        className="mx-auto grid w-full max-w-5xl content-start gap-6"
        aria-labelledby="catalog-heading"
      >
        <div className="grid gap-2">
          <h1 id="catalog-heading" className="text-2xl font-bold tracking-tight text-foreground">
            Catalog
          </h1>
          {/* US-07 AT-4: the seeded retailers and prices are invented; say so up front. */}
          <p className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <span className="rounded-full border border-border px-2 py-0.5 text-xs font-medium text-foreground">
              Sample data
            </span>
            Retailers and prices are fictional.
          </p>
        </div>
        <CurrentRoomBanner />
        <CategoryFilter selected={parsed.data.category} />
        <PlacementError />
        <CatalogList
          items={items}
          category={parsed.data.category}
          renderAction={(item) => <AddToLayoutButton item={item} />}
        />
      </section>
    </main>
  )
}