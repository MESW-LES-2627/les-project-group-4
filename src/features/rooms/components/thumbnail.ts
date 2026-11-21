/** Shared box for the room and saved-layout miniature cards. */
export const THUMBNAIL_WIDTH = 120
export const THUMBNAIL_HEIGHT = 80
export const THUMBNAIL_PADDING = 10

export interface ThumbnailBox {
  width: number
  height: number
  x: number
  y: number
  /** Thumbnail units per centimetre. */
  scale: number
}

/**
 * Fits a room's real proportions into the shared thumbnail box, centred, with
 * room to breathe around the edges.
 */
export function fitRoomToThumbnail(widthCm: number, lengthCm: number): ThumbnailBox {
  const availableWidth = THUMBNAIL_WIDTH - THUMBNAIL_PADDING * 2
  const availableHeight = THUMBNAIL_HEIGHT - THUMBNAIL_PADDING * 2
  const ratio = widthCm / lengthCm

  let width = availableWidth
  let height = width / ratio
  if (height > availableHeight) {
    height = availableHeight
    width = height * ratio
  }

  return {
    width,
    height,
    x: (THUMBNAIL_WIDTH - width) / 2,
    y: (THUMBNAIL_HEIGHT - height) / 2,
    scale: width / widthCm,
  }
}
