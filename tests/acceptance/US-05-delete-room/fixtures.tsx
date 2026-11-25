import { render, screen } from '@testing-library/react'
import type { UserEvent } from '@testing-library/user-event'
import { vi } from 'vitest'

import { DraftLayoutsProvider } from '@/features/plan/components/DraftLayoutsProvider'
import type { PlacedItem } from '@/features/plan/model/layout'
import { RoomDetails } from '@/features/rooms/components/RoomDetails'
import type { LayoutWithItems, Room } from '@/features/rooms/types'

import { DraftProbe, SeedDraft } from './DraftState'

// US-05 component tests: the room page body in jsdom (same setup as US-03), with a router
// whose calls the tests can read, and a fake API for the DELETE requests.

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

export const sofa: PlacedItem = {
  id: 'sofa-1',
  catalogItemId: 4,
  name: 'Sofa',
  widthCm: 200,
  depthCm: 90,
  priceCents: 49900,
  xCm: 100,
  yCm: 45,
  rotationDeg: 0,
}

/** Two saved layouts with no items: enough for the confirmation to count them. */
export const twoLayouts: LayoutWithItems[] = [
  { id: 7, name: 'Cosy corner', itemCount: 0, updatedAt: '2026-11-20T10:00:00.000Z', items: [] },
  { id: 8, name: 'Reading nook', itemCount: 0, updatedAt: '2026-11-21T10:00:00.000Z', items: [] },
]

interface RenderOptions {
  layouts?: LayoutWithItems[]
  /** Unsaved plans per room id, set before the test acts. */
  drafts?: Record<number, PlacedItem[]>
  /** The catalog's "add to" room. */
  currentRoomId?: number | null
}

/**
 * Renders the room page body the way the app does: inside the session draft provider. A probe
 * next to it shows the draft state, so tests can check what deleting the room left behind.
 */
export function renderRoomDetails({ layouts = [], drafts = {}, currentRoomId = null }: RenderOptions = {}) {
  const currentRoom =
    currentRoomId === null ? null : { id: currentRoomId, name: 'Room', widthCm: 300, lengthCm: 400 }
  return render(
    <DraftLayoutsProvider>
      <SeedDraft drafts={drafts} currentRoom={currentRoom}>
        <RoomDetails room={room} catalogItems={[]} category={undefined} layouts={layouts} />
        <DraftProbe roomIds={[room.id, 9]} />
      </SeedDraft>
    </DraftLayoutsProvider>,
  )
}

/** Replaces fetch with a fake API that answers every DELETE with `status` (204 by default). */
export function stubDeleteApi(status = 204) {
  return vi.spyOn(globalThis, 'fetch').mockImplementation(async () =>
    status === 204
      ? new Response(null, { status: 204 })
      : Response.json({ message: 'Could not delete the room. Please try again later.' }, { status }),
  )
}

/** Presses the room's "Delete room" action, which opens the confirmation dialog. */
export async function openDeleteConfirmation(user: UserEvent) {
  await user.click(screen.getByRole('button', { name: 'Delete room' }))
}

/** The confirmation dialog, found by its question. */
export function confirmation() {
  return screen.queryByRole('alertdialog', { name: `Delete “${room.name}”?` })
}

/** The session draft state shown by the probe. */
export function draftState() {
  return screen.getByTestId('draft-probe').textContent
}
