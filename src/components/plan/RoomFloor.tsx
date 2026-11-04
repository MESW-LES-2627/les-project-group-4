import type { RoomSize } from '@/lib/geometry/plan'
import { roomOutline } from '@/lib/geometry/plan'

/** flat plan colour */
export const FLOOR_COLOR = '#f1f5f9'
export const OUTLINE_COLOR = '#334155'

/**
 * The room floor and its outline, in scene metres.
 *
 * The floor lies on XZ and the outline comes from the same `roomOutline()`
 * contract as the rest of the plan.
 */
export function RoomFloor({ room }: { room: RoomSize }) {
  const width = room.widthCm / 100
  const depth = room.lengthCm / 100
  const outline = roomOutline(room)
  const positions = new Float32Array(
    outline.flatMap(({ x, y }) => [x / 100, 0, y / 100]),
  )

  return (
    <group name="room">
      <mesh
        name="room-floor"
        position={[width / 2, -0.001, depth / 2]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <planeGeometry args={[width, depth]} />
        <meshBasicMaterial color={FLOOR_COLOR} />
      </mesh>

      <lineLoop name="room-outline" position={[0, 0.001, 0]}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        </bufferGeometry>
        <lineBasicMaterial color={OUTLINE_COLOR} />
      </lineLoop>
    </group>
  )
}
