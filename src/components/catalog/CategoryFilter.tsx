import Link from 'next/link'

import { CATEGORY_LABELS, ITEM_CATEGORIES } from '@/lib/catalog'
import { catalogHref } from '@/lib/catalogFilters'
import type { ListItemsQuery } from '@/lib/schemas/item'

const LINK_CLASS =
  'rounded-full border border-border px-3 py-1 text-sm transition-colors hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none aria-[current=page]:border-foreground aria-[current=page]:bg-foreground aria-[current=page]:text-background'

/**
 * US-07: one link per category (plus "All"); the selected one is marked with aria-current.
 * US-08: the links keep the other filters (price, tags), so category combines with them (AT-5).
 */
export function CategoryFilter({ query }: { query: ListItemsQuery }) {
  const selected = query.category
  return (
    <nav aria-label="Categories">
      <ul className="flex flex-wrap gap-2">
        <li>
          <Link
            href={catalogHref({ ...query, category: undefined })}
            aria-current={selected === undefined ? 'page' : undefined}
            className={LINK_CLASS}
          >
            All
          </Link>
        </li>
        {ITEM_CATEGORIES.map((category) => (
          <li key={category}>
            <Link
              href={catalogHref({ ...query, category })}
              aria-current={selected === category ? 'page' : undefined}
              className={LINK_CLASS}
            >
              {CATEGORY_LABELS[category]}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  )
}