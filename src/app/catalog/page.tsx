import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { CatalogBrowser } from '@/components/catalog/CatalogBrowser'
import { CurrentRoomBanner } from '@/components/catalog/CurrentRoomBanner'
import { PlacementError } from '@/components/catalog/PlacementError'
import { findItems, findTagOptions } from '@/lib/items'
import { listItemsQuerySchema, readListItemsQuery } from '@/lib/schemas/item'

export const metadata: Metadata = {
  title: 'FurniMi - Catalog',
}

/**
 * US-07/US-08: loads the catalog on the server, filtered by ?category=, ?maxPrice=, ?style=
 * and ?room=. An invalid filter shows not-found.tsx; loading.tsx and error.tsx cover the other
 * states. Later filter changes are handled on the client by CatalogBrowser.
 * US-09: the banner and the per-card add buttons target the last room opened.
 */
export default async function CatalogPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  // Reading searchParams makes the page render on every request, so the list is always current.
  const params = new URLSearchParams()
  // Rebuild URLSearchParams so the page reads the query exactly like the API route does.
  for (const [key, value] of Object.entries(await searchParams)) {
    if (value === undefined) continue
    for (const one of Array.isArray(value) ? value : [value]) params.append(key, one)
  }
  const parsed = listItemsQuerySchema.safeParse(readListItemsQuery(params))
  if (!parsed.success) {
    notFound()
  }

  const [items, tagOptions] = await Promise.all([findItems(parsed.data), findTagOptions()])

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
        <PlacementError />
        {/*
          key: a new id on every server render, so any server navigation (a category link, the
          header link) remounts CatalogBrowser with the new data. A key built from the URL would
          keep stale client state when the new URL equals the first one.
        */}
        <CatalogBrowser
          key={crypto.randomUUID()}
          initialQuery={parsed.data}
          initialItems={items}
          tagOptions={tagOptions}
        />
      </section>
    </main>
  )
}
