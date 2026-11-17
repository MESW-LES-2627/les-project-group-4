import type { CatalogItem, Room } from '@/api/types'
import { AddToLayoutButton } from '@/components/catalog/AddToLayoutButton'
import { CatalogList } from '@/components/catalog/CatalogList'
import { CategoryFilter } from '@/components/catalog/CategoryFilter'
import { PlacementError } from '@/components/catalog/PlacementError'
import type { ItemCategory } from '@/lib/catalog'

/**
 * US-09: the catalog inside the room page. Category links stay on the room and
 * the add buttons target it directly, so the plan never leaves the screen.
 */
export function RoomCatalog({
  room,
  items,
  category,
}: {
  room: Room
  items: CatalogItem[]
  category: ItemCategory | undefined
}) {
  return (
    <section aria-labelledby="room-catalog-heading" className="grid gap-3">
      <div className="grid gap-1">
        <h2 id="room-catalog-heading" className="text-sm font-semibold text-foreground">
          Add items
        </h2>
        <p className="text-sm text-muted-foreground">
          Pick a category, then add items to this room.
        </p>
      </div>

      <CategoryFilter selected={category} basePath={`/rooms/${room.id}`} />
      <PlacementError roomId={room.id} />
      <CatalogList
        items={items}
        category={category}
        renderAction={(item) => <AddToLayoutButton item={item} room={room} />}
      />
    </section>
  )
}
