import { render, screen } from '@testing-library/react'
import type { UserEvent } from '@testing-library/user-event'
import { vi } from 'vitest'

import { DraftLayoutsProvider } from '@/features/plan/components/DraftLayoutsProvider'
import { RoomDetails } from '@/features/rooms/components/RoomDetails'
import type { LayoutWithItems, Room } from '@/features/rooms/types'

// US-05 component tests: the room page body in jsdom (same setup as US-03), with a router
// whose calls the tests can read, and a fake DELETE /api/rooms/[id].

// Read only when a component calls useRouter(), so the mock factory can refer to it.
export const router = { refresh: vi.fn(), push: vi.fn(), replace: vi.fn() }

vi.mock('next/navigation', () => ({ useRouter: () => router }))
// The 2D plan needs WebGL, which jsdom does not have (see US-03-view-room-details/fixtures.tsx).
vi.mock('@/features/rooms/components/RoomPlan', () => ({
  RoomPlan: () => <div data-testid="room-plan" />,
}))

export const room: Room = {
  id: 3,
  name: 'Bedroom',
  widthCm: 300,
  lengthCm: 400,
  city: null,
  latitude: null,
  longitude: null,
}

/** Two saved layouts with no items: enough for the confirmation to count them. */
export const twoLayouts: LayoutWithItems[] = [
  { id: 7, name: 'Cosy corner', itemCount: 0, updatedAt: '2026-11-20T10:00:00.000Z', items: [] },
  { id: 8, name: 'Reading nook', itemCount: 0, updatedAt: '2026-11-21T10:00:00.000Z', items: [] },
]

/** Renders the room page body the way the app does: inside the session draft provider. */
export function renderRoomDetails(layouts: LayoutWithItems[] = []) {
  return render(
    <DraftLayoutsProvider>
      <RoomDetails room={room} catalogItems={[]} category={undefined} layouts={layouts} />
    </DraftLayoutsProvider>,
  )
}

/** Replaces fetch with a fake DELETE /api/rooms/[id] answering `status` (204 by default). */
export function stubDeleteRoomApi(status = 204) {
  return vi.spyOn(globalThis, 'fetch').mockImplementation(async () =>
    status === 204
      ? new Response(null, { status: 204 })
      : Response.json({ message: 'Could not delete the room. Please try again later.' }, { status }),
  )
}

/** Presses the room's "Delete room" action, which opens the confirmation. */
export async function openDeleteConfirmation(user: UserEvent) {
  await user.click(screen.getByRole('button', { name: 'Delete room' }))
}

/** The confirmation, found by its question. */
export function confirmation() {
  return screen.queryByRole('group', { name: `Delete “${room.name}”?` })
}
