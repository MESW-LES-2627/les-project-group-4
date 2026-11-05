import Link from 'next/link'

import { CATEGORY_LABELS, ITEM_CATEGORIES } from '@/lib/catalog'
import type { ItemCategory } from '@/lib/catalog'

const LINK_CLASS =
  'rounded-full border border-border px-3 py-1 text-sm transition-colors hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none aria-[current=page]:border-foreground aria-[current=page]:bg-foreground aria-[current=page]:text-background'

/** US-07: one link per category (plus "All"); the selected one is marked with aria-current. */
export function CategoryFilter({ selected }: { selected: ItemCategory | undefined }) {
  return (
    <nav aria-label="Categories">
      <ul className="flex flex-wrap gap-2">
        <li>
          <Link
            href="/catalog"
            aria-current={selected === undefined ? 'page' : undefined}
            className={LINK_CLASS}
          >
            All
          </Link>
        </li>
        {ITEM_CATEGORIES.map((category) => (
          <li key={category}>
            <Link
              href={`/catalog?category=${category}`}
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