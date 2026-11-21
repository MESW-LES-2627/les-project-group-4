'use client'

import type { Room } from '@/api/types'
import type { CatalogItem } from '@/features/catalog/types'
import { AddToLayoutButton } from '@/features/catalog/components/AddToLayoutButton'
import { CatalogList } from '@/features/catalog/components/CatalogList'
import { CategoryFilter } from '@/features/catalog/components/CategoryFilter'
import { PlacementError } from '@/features/catalog/components/PlacementError'
import type { ItemCategory } from '@/features/catalog/model/catalog'

/**
 * US-09: the catalog inside the room page. Category links stay on the room and
 * the add buttons target it directly, so the plan never leaves the screen.
 * Items can also be dragged from the catalog onto the 2D plan.
 */
export function RoomCatalog({
  room,
  items,
  category,
  className = '',
}: {
  room: Room
  items: CatalogItem[]
  category: ItemCategory | undefined
  /** Extra classes for the panel, e.g. its position in the editor grid. */
  className?: string
}) {
  function handleItemDragStart(
    item: CatalogItem,
    event: React.DragEvent<HTMLLIElement>,
  ) {
    event.dataTransfer.setData('application/json', JSON.stringify(item))
    event.dataTransfer.effectAllowed = 'copy'
  }

  return (
    <section
      aria-labelledby="room-catalog-heading"
      className={`grid gap-3 rounded-lg border border-border bg-background p-4 lg:h-full lg:grid-rows-[auto_minmax(0,1fr)] ${className}`.trim()}
    >
      <div className="grid gap-3">
        <div className="grid gap-1">
          <h2 id="room-catalog-heading" className="text-sm font-semibold text-foreground">
            Add items
          </h2>
          <p className="text-sm text-muted-foreground">
            Drag an item onto the plan, or click Add.
          </p>
        </div>

        <CategoryFilter query={{ category }} basePath={`/rooms/${room.id}`} />
        <PlacementError roomId={room.id} />
      </div>

      <div className="lg:min-h-0 lg:overflow-y-auto">
        <CatalogList
          items={items}
          category={category}
          layout="list"
          onItemDragStart={handleItemDragStart}
          renderAction={(item) => <AddToLayoutButton item={item} room={room} />}
        />
      </div>
    </section>
  )
}
