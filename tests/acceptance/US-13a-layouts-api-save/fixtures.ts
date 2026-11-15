import type { LayoutDetails } from '@/api/types'
import { POST } from '@/app/api/rooms/[id]/layouts/route'

export const savedAt = new Date('2026-11-11T18:00:00.000Z')
export const sofa = { catalogItemId: 4, xCm: 120, yCm: 45.5, rotationDeg: 90 }
export const validBody = { name: 'Cosy corner', items: [sofa] }

/** What Prisma returns for the saved layout (LAYOUT_DETAILS_SELECT). */
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

export const savedLayout: LayoutDetails = {
  id: 7,
  roomId: 3,
  name: 'Cosy corner',
  createdAt: savedAt.toISOString(),
  updatedAt: savedAt.toISOString(),
  items: [
    {
      id: 11,
      catalogItemId: 4,
      name: 'Sofa',
      widthCm: 200,
      depthCm: 90,
      priceCents: 49900,
      xCm: 120,
      yCm: 45.5,
      rotationDeg: 90,
    },
  ],
}

/** Calls POST the way Next.js does: `params` is a Promise. */
export function post(body: unknown, id = '3') {
  const request = new Request(`http://localhost/api/rooms/${id}/layouts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  })
  return POST(request, { params: Promise.resolve({ id }) })
}
