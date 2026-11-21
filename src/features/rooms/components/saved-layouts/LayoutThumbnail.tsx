import type { Room, SavedLayoutItem } from '@/features/rooms/types'
import {
  ITEM_BORDER_OPACITY,
  ITEM_COLOR,
  ITEM_FILL_OPACITY,
} from '@/features/plan/components/scene/PlacedItem'
import { footprintCorners, type Point } from '@/features/plan/model/geometry'

/** Same box and padding as RoomThumbnail, so the two card sets look like siblings. */
const BOX_WIDTH = 120
const BOX_HEIGHT = 80
const PADDING = 10

/**
 * US-14b: a miniature top-down view of a saved layout. The room keeps its real
 * proportions and every item is drawn at its saved position, size and rotation.
 * Purely decorative: the card already names the layout and counts its items.
 */
export function LayoutThumbnail({
  room,
  layoutId,
  items,
}: {
  room: Room
  layoutId: number
  items: readonly SavedLayoutItem[]
}) {
  const availableWidth = BOX_WIDTH - PADDING * 2
  const availableHeight = BOX_HEIGHT - PADDING * 2
  const ratio = room.widthCm / room.lengthCm

  let width = availableWidth
  let height = width / ratio
  if (height > availableHeight) {
    height = availableHeight
    width = height * ratio
  }

  const x = (BOX_WIDTH - width) / 2
  const y = (BOX_HEIGHT - height) / 2
  const scale = width / room.widthCm
  const clipId = `layout-room-${layoutId}`

  function toSvg(point: Point) {
    return {
      x: x + point.x * scale,
      y: y + point.y * scale,
    }
  }

  return (
    <span
      className="relative flex aspect-3/2 items-center justify-center overflow-hidden border-b border-border bg-secondary"
      aria-hidden="true"
    >
      <span className="absolute inset-0 opacity-70 [background-image:linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] [background-size:16px_16px]" />
      <svg
        viewBox={`0 0 ${BOX_WIDTH} ${BOX_HEIGHT}`}
        className="relative h-full w-full"
      >
        <defs>
          <clipPath id={clipId}>
            <rect x={x} y={y} width={width} height={height} />
          </clipPath>
        </defs>

        <rect
          x={x}
          y={y}
          width={width}
          height={height}
          fill="var(--brand-soft)"
          stroke="var(--brand)"
          strokeWidth="1.5"
          vectorEffect="non-scaling-stroke"
        />

        <g clipPath={`url(#${clipId})`}>
          {items.map((item) => {
            const points = footprintCorners(
              { widthCm: item.widthCm, depthCm: item.depthCm },
              { xCm: item.xCm, yCm: item.yCm, rotationDeg: item.rotationDeg },
            )
              .map((corner) => {
                const point = toSvg(corner)
                return `${point.x},${point.y}`
              })
              .join(' ')

            return (
              <polygon
                key={item.id}
                points={points}
                fill={ITEM_COLOR}
                fillOpacity={ITEM_FILL_OPACITY}
                stroke={ITEM_COLOR}
                strokeOpacity={ITEM_BORDER_OPACITY}
                strokeWidth="1"
                vectorEffect="non-scaling-stroke"
              />
            )
          })}
        </g>
      </svg>
    </span>
  )
}
