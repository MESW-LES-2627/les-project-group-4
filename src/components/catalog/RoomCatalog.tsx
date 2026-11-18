'use client'

import type { CatalogItem, Room } from '@/api/types'
import { AddToLayoutButton } from '@/components/catalog/AddToLayoutButton'
import { CatalogList } from '@/components/catalog/CatalogList'
import { CategoryFilter } from '@/components/catalog/CategoryFilter'
import { PlacementError } from '@/components/catalog/PlacementError'
import type { ItemCategory } from '@/lib/catalog'

/**
 * US-09: the catalog inside the room page. Category links stay on the room and
 * the add buttons target it directly, so the plan never leaves the screen.
 * Items can also be dragged from the catalog onto the 2D plan.
 */
export function RoomCatalog({
  room,
  items,
  category,
  headerClassName = '',
}: {
  room: Room
  items: CatalogItem[]
  category: ItemCategory | undefined
  headerClassName?: string
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
      className="grid gap-3 rounded-lg border border-border bg-background p-4 lg:sticky lg:top-6 lg:max-h-[640px] lg:overflow-y-auto"
    >
      <div className={`grid gap-1 ${headerClassName}`.trim()}>
        <h2 id="room-catalog-heading" className="text-sm font-semibold text-foreground">
          Add items
        </h2>
        <p className="text-sm text-muted-foreground">
          Drag an item onto the plan, or click Add.
        </p>
      </div>

      <CategoryFilter query={{ category }} basePath={`/rooms/${room.id}`} />
      <PlacementError roomId={room.id} />
      <CatalogList
        items={items}
        category={category}
        layout="list"
        onItemDragStart={handleItemDragStart}
        renderAction={(item) => <AddToLayoutButton item={item} room={room} />}
      />
    </section>
  )
}
