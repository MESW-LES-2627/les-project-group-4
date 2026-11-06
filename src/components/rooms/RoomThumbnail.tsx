import type { Room } from '@/api/types'

/** Keeps the drawing inside the thumbnail with room to breathe. */
const BOX_WIDTH = 120
const BOX_HEIGHT = 80
const PADDING = 10

/**
 * A small top-down blueprint of the room, scaled to the real proportions of
 * its width and length. Purely decorative: the card already names and measures
 * the room.
 */
export function RoomThumbnail({ room }: { room: Room }) {
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

  return (
    <div
      className="relative flex aspect-3/2 items-center justify-center overflow-hidden border-b border-border bg-secondary"
      aria-hidden="true"
    >
      <div className="absolute inset-0 opacity-70 [background-image:linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] [background-size:16px_16px]" />
      <svg
        viewBox={`0 0 ${BOX_WIDTH} ${BOX_HEIGHT}`}
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
