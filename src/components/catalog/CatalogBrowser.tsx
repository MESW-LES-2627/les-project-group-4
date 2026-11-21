'use client'

import { useState } from 'react'
import type { FormEvent } from 'react'

import type { CatalogItem } from '@/features/catalog/types'
import { AddToLayoutButton } from '@/components/catalog/AddToLayoutButton'
import { CatalogList } from '@/components/catalog/CatalogList'
import { CategoryFilter } from '@/components/catalog/CategoryFilter'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { catalogHref, hasFilters, parsePriceInput, tagLabel, toggleTag } from '@/features/catalog/model/catalogFilters'
import type { ListItemsQuery } from '@/features/catalog/schema'
import { useCatalogItems } from '@/hooks/useCatalogItems'

interface CatalogBrowserProps {
  initialQuery: ListItemsQuery
  initialItems: CatalogItem[]
  tagOptions: { style: string[]; room: string[] }
}

/**
 * US-08: category links, max price and tag filters over the catalog list. The server renders
 * the first list from the URL; each filter change updates the URL (replaceState, no server
 * round trip) and reloads the list from GET /api/items, keeping only the latest response.
 */
export function CatalogBrowser({ initialQuery, initialItems, tagOptions }: CatalogBrowserProps) {
  const [query, setQuery] = useState(initialQuery)
  const [priceText, setPriceText] = useState(
    initialQuery.maxPriceCents === undefined ? '' : String(initialQuery.maxPriceCents / 100),
  )
  const [priceError, setPriceError] = useState<string | null>(null)
  const { items, isLoading, error, load } = useCatalogItems(initialItems)

  function apply(next: ListItemsQuery) {
    setQuery(next)
    // Next.js syncs replaceState with useSearchParams; the page is not re-rendered on the server.
    window.history.replaceState(null, '', catalogHref(next))
    void load(next)
  }

  function onPriceSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const cents = parsePriceInput(priceText)
    if (cents === null) {
      setPriceError('Enter a price in euros, e.g. 500 or 499,99.')
      return
    }
    setPriceError(null)
    apply({ ...query, maxPriceCents: cents })
  }

  function clear() {
    setPriceText('')
    setPriceError(null)
    apply({})
  }

  return (
    <div className="grid gap-6">
      <CategoryFilter query={query} />

      <div className="grid gap-4 rounded-lg border border-border p-4">
        <form className="flex flex-wrap items-end gap-2" onSubmit={onPriceSubmit} noValidate>
          <div className="grid gap-1">
            <Label htmlFor="max-price">Maximum price (€)</Label>
            <Input
              id="max-price"
              inputMode="decimal"
              value={priceText}
              onChange={(event) => setPriceText(event.target.value)}
              aria-invalid={priceError !== null}
              aria-describedby={priceError === null ? undefined : 'max-price-error'}
              className="w-32"
            />
          </div>
          <Button type="submit" variant="outline">
            Apply
          </Button>
          {priceError !== null && (
            <p id="max-price-error" className="basis-full text-sm text-destructive">
              {priceError}
            </p>
          )}
        </form>

        <TagFilter
          legend="Style"
          tags={tagOptions.style}
          selected={query.style}
          onToggle={(tag) => apply({ ...query, style: toggleTag(query.style, tag) })}
        />
        <TagFilter
          legend="Room type"
          tags={tagOptions.room}
          selected={query.room}
          onToggle={(tag) => apply({ ...query, room: toggleTag(query.room, tag) })}
        />

        {hasFilters(query) && (
          <Button type="button" variant="ghost" className="justify-self-start" onClick={clear}>
            Clear filters
          </Button>
        )}
      </div>

      {error !== null && (
        <p role="alert" className="text-sm text-destructive">
          {error}{' '}
          <button type="button" className="underline" onClick={() => void load(query)}>
            Try again
          </button>
        </p>
      )}
      <div aria-busy={isLoading}>
        <CatalogList
          items={items}
          category={query.category}
          filtered={hasFilters({ ...query, category: undefined })}
          onClearFilters={clear}
          renderAction={(item) => <AddToLayoutButton item={item} />}
        />
      </div>
    </div>
  )
}

/** US-08: one checkbox per tag of a facet (style or room type); several can be selected (OR). */
function TagFilter({
  legend,
  tags,
  selected,
  onToggle,
}: {
  legend: string
  tags: string[]
  selected: string[] | undefined
  onToggle: (tag: string) => void
}) {
  return (
    <fieldset className="grid gap-2">
      <legend className="text-sm font-medium text-foreground">{legend}</legend>
      <div className="flex flex-wrap gap-3">
        {tags.map((tag) => (
          <label key={tag} className="flex items-center gap-1.5 text-sm">
            <input
              type="checkbox"
              checked={selected?.includes(tag) ?? false}
              onChange={() => onToggle(tag)}
            />
            {tagLabel(tag)}
          </label>
        ))}
      </div>
    </fieldset>
  )
}
