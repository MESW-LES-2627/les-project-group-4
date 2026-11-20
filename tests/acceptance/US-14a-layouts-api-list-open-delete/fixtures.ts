import { GET as listLayouts } from '@/app/api/rooms/[id]/layouts/route'
import { DELETE, GET } from '@/app/api/rooms/[id]/layouts/[layoutId]/route'

export const savedAt = new Date('2026-11-11T18:00:00.000Z')

/** What Prisma returns for one saved layout (LAYOUT_DETAILS_SELECT). */
export const savedRow = {
  id: 7,
  roomId: 3,
  name: 'Cosy corner',
  createdAt: savedAt,
  updatedAt: savedAt,
  items: [
    {
      id: 11,
      xCm: 120,
      yCm: 45.5,
      rotationDeg: 90,
      priceCents: 49900,
      item: { id: 4, name: 'Sofa', widthCm: 200, depthCm: 90 },
    },
  ],
}

/** Calls the handlers the way Next.js does: `params` is a Promise. */
export function list(id = '3') {
  return listLayouts(new Request(`http://localhost/api/rooms/${id}/layouts`), {
    params: Promise.resolve({ id }),
  })
}

export function open(id = '3', layoutId = '7') {
  return GET(new Request(`http://localhost/api/rooms/${id}/layouts/${layoutId}`), {
    params: Promise.resolve({ id, layoutId }),
  })
}

export function remove(id = '3', layoutId = '7') {
  return DELETE(
    new Request(`http://localhost/api/rooms/${id}/layouts/${layoutId}`, { method: 'DELETE' }),
    { params: Promise.resolve({ id, layoutId }) },
  )
}
