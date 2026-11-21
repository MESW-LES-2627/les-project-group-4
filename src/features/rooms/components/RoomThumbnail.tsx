import type { Room } from '@/features/rooms/types'

import { fitRoomToThumbnail, THUMBNAIL_HEIGHT, THUMBNAIL_WIDTH } from './thumbnail'

/**
 * A small top-down blueprint of the room, scaled to the real proportions of
 * its width and length. Purely decorative: the card already names and measures
 * the room.
 */
export function RoomThumbnail({ room }: { room: Room }) {
  const { width, height, x, y } = fitRoomToThumbnail(room.widthCm, room.lengthCm)

  return (
    <div
      className="relative flex aspect-3/2 items-center justify-center overflow-hidden border-b border-border bg-secondary"
      aria-hidden="true"
    >
      <div className="absolute inset-0 opacity-70 [background-image:linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] [background-size:16px_16px]" />
      <svg
        viewBox={`0 0 ${THUMBNAIL_WIDTH} ${THUMBNAIL_HEIGHT}`}
        className="relative h-full w-full"
      >
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
      </svg>
    </div>
  )
}
