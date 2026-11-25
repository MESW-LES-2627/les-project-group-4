import { render, screen } from '@testing-library/react'
import type { UserEvent } from '@testing-library/user-event'
import { vi } from 'vitest'

import { DraftLayoutsProvider } from '@/features/plan/components/DraftLayoutsProvider'
import type { PlacedItem } from '@/features/plan/model/layout'
import { RoomDetails } from '@/features/rooms/components/RoomDetails'
import type { LayoutWithItems, Room } from '@/features/rooms/types'

import { WithPlacedItems } from './WithPlacedItems'

// US-04 component tests: the room page body in jsdom (same setup as US-03 and US-05), with a
// router whose calls the tests can read, and a fake PATCH /api/rooms/[id].

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

/** A 200 × 90 cm sofa against the top wall: it needs a room at least 200 cm wide. */
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

/** Renders the room page body the way the app does: inside the session draft provider. */
export function renderRoomDetails(
  options: { room?: Room; placedItems?: PlacedItem[]; layouts?: LayoutWithItems[] } = {},
) {
  const body = (current: Room) => (
    <DraftLayoutsProvider>
      <WithPlacedItems roomId={room.id} items={options.placedItems ?? []}>
        <RoomDetails
          room={current}
          catalogItems={[]}
          category={undefined}
          layouts={options.layouts ?? []}
        />
      </WithPlacedItems>
    </DraftLayoutsProvider>
  )
  const view = render(body(options.room ?? room))
  return { ...view, rerenderRoom: (next: Room) => view.rerender(body(next)) }
}

/** Replaces fetch with a fake PATCH /api/rooms/[id] that answers with the room it was sent. */
export function stubUpdateRoomApi() {
  return vi.spyOn(globalThis, 'fetch').mockImplementation(async (_url, init) =>
    Response.json({ ...room, ...JSON.parse(String(init?.body)) }, { status: 200 }),
  )
}

/** Opens the edit dialog from the room header. */
export async function openEditForm(user: UserEvent) {
  await user.click(screen.getByRole('button', { name: 'Edit room' }))
}

/** The edit form (in the dialog), found by its name. */
export function editForm() {
  return screen.queryByRole('form', { name: 'Edit room' })
}

/** Replaces a field's value, as a user selecting it and typing would. */
export async function retype(user: UserEvent, label: RegExp, value: string) {
  const input = screen.getByLabelText(label)
  await user.clear(input)
  if (value !== '') await user.type(input, value)
}
