'use client'

import { MapControls, OrthographicCamera } from '@react-three/drei'
import { Canvas, useThree } from '@react-three/fiber'

import type { RoomSize } from '@/lib/geometry/plan'
import type { PlacedItem as PlacedItemData } from '@/lib/layout/layout'

import { fitOrthoFrustum } from './ortho'
import { RoomScene } from './RoomScene'

export interface Plan2DProps {
  room: RoomSize
  items?: PlacedItemData[]
  selectedId?: string | null
  onSelect?: (id: string | null) => void
}

const CAMERA_HEIGHT_M = 10

/**
 * Keeps the orthographic camera centred on the room, looking straight down,
 * with the plan's top edge at the top of the screen (up = -Z).
 */
export function FitOrthoCamera({ room }: { room: RoomSize }) {
  const size = useThree((state) => state.size)
  const frustum = fitOrthoFrustum(room, size.width / size.height)
  const width = room.widthCm / 100
  const depth = room.lengthCm / 100

  return (
    <OrthographicCamera
      makeDefault
      position={[width / 2, CAMERA_HEIGHT_M, depth / 2]}
      rotation={[-Math.PI / 2, 0, 0]}
      up={[0, 0, -1]}
      left={frustum.left}
      right={frustum.right}
      top={frustum.top}
      bottom={frustum.bottom}
      near={0.1}
      far={100}
    />
  )
}

/**
 * The 2D plan mode: an orthographic top-down camera over the shared
 * camera-agnostic RoomScene. MapControls pans and zooms but never rotates.
 */
export function Plan2D({
  room,
  items = [],
  selectedId = null,
  onSelect,
}: Plan2DProps) {
  const width = room.widthCm / 100
  const depth = room.lengthCm / 100

  return (
    <Canvas
      orthographic
      flat
      dpr={[1, 2]}
      gl={{ antialias: true }}
      onPointerMissed={onSelect ? () => onSelect(null) : undefined}
      style={{ touchAction: 'none' }}
    >
      <color attach="background" args={['#f8fafc']} />
      <FitOrthoCamera room={room} />
      <RoomScene
        room={room}
        items={items}
        selectedId={selectedId}
        onSelect={onSelect}
      />
      <MapControls
        makeDefault
        enableRotate={false}
        enableDamping
        dampingFactor={0.12}
        target={[width / 2, 0, depth / 2]}
        minZoom={0.5}
        maxZoom={8}
      />
    </Canvas>
  )
}
