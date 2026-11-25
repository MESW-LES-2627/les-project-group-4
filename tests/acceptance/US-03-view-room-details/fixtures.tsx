import { render } from '@testing-library/react'
import { vi } from 'vitest'

import { DraftLayoutsProvider } from '@/features/plan/components/DraftLayoutsProvider'
import { RoomDetails } from '@/features/rooms/components/RoomDetails'
import type { Room } from '@/features/rooms/types'

// CH-05: what RoomDetails needs to render in jsdom.
// - The saved-layouts bar calls useRouter(); there is no Next.js app router in a test.
// - The 2D plan (react-three-fiber) needs WebGL, which jsdom does not have. The plan has its
//   own R3F tests (US-06a); here it is replaced by a placeholder.
vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: vi.fn(), push: vi.fn(), replace: vi.fn() }),
}))
vi.mock('@/features/rooms/components/RoomPlan', () => ({
  RoomPlan: () => <div data-testid="room-plan" />,
}))

/** Renders the room page body the way the app does: inside the session draft provider. */
export function renderRoomDetails(room: Room) {
  return render(
    <DraftLayoutsProvider>
      <RoomDetails room={room} catalogItems={[]} category={undefined} layouts={[]} />
    </DraftLayoutsProvider>,
  )
}
