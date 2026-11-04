import type { RoomSize } from '@/lib/geometry/plan'

import { RoomFloor } from './RoomFloor'

export interface RoomSceneProps {
  room: RoomSize
}

/**
 * The camera-agnostic room scene.
 *
 * `Plan2D` adds an orthographic camera and controls; a future 3D view can use
 * the same scene graph and item components with a perspective camera.
 * Coordinates come from src/lib/geometry/plan.ts: cm -> metres, plan y ->
 * scene z, Y-up.
 */
export function RoomScene({ room }: RoomSceneProps) {
  return (
    <group name="room-scene">
      <RoomFloor room={room} />
    </group>
  )
}
