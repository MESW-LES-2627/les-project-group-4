'use client'

import { useLayoutEffect, useRef, useState, type ComponentRef } from 'react'
import { MapControls, OrthographicCamera } from '@react-three/drei'
import { Canvas, useThree } from '@react-three/fiber'
import { RotateCcw } from 'lucide-react'
import type { OrthographicCamera as OrthographicCameraImpl } from 'three'

import { Button } from '@/components/ui/button'
import type { RoomSize } from '@/lib/geometry/plan'
import type { PlacedItem as PlacedItemData } from '@/lib/layout/layout'

import { ItemLabel } from './ItemLabel'
import { CAMERA_HEIGHT_M, fitOrthoFrustum, planViewPose } from './ortho'
import { RoomScene } from './scene/RoomScene'

export interface Plan2DProps {
  room: RoomSize
  items?: PlacedItemData[]
  selectedId?: string | null
  onSelect?: (id: string | null) => void
}

/**
 * Keeps the orthographic camera centred on the room, looking straight down,
 * with the plan's top edge at the top of the screen (up = -Z).
 */
export function FitOrthoCamera({ room }: { room: RoomSize }) {
  const size = useThree((state) => state.size)
  const frustum = fitOrthoFrustum(room, size.width / size.height)
  const { position } = planViewPose(room)

  return (
    <OrthographicCamera
      makeDefault
      position={position}
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

function PlanControls({
  room,
  resetToken,
}: {
  room: RoomSize
  resetToken: number
}) {
  const controlsRef = useRef<ComponentRef<typeof MapControls>>(null)
  const { position, target } = planViewPose(room)
  const centerX = position[0]
  const centerZ = position[2]

  // Runs on mount, on a room size change and whenever "reset view" is used.
  useLayoutEffect(() => {
    const controls = controlsRef.current
    if (!controls) return

    const camera = controls.object as OrthographicCameraImpl
    camera.position.set(centerX, CAMERA_HEIGHT_M, centerZ)
    camera.zoom = 1
    camera.updateProjectionMatrix()

    controls.target.set(centerX, 0, centerZ)
    controls.update()
  }, [centerX, centerZ, resetToken])

  return (
    <MapControls
      ref={controlsRef}
      makeDefault
      enableRotate={false}
      enableDamping
      dampingFactor={0.12}
      // MapControls' default pans along the ground plane, which is the view
      // axis for a top-down camera: vertical drags would move the camera
      // along its own line of sight and look like no movement at all.
      screenSpacePanning
      target={target}
      minZoom={0.5}
      maxZoom={8}
    />
  )
}

/**
 * The 2D plan mode: an orthographic top-down camera over the shared
 * camera-agnostic RoomScene. MapControls pans and zooms but never rotates,
 * and "Reset view" returns the camera to the fitted, centred default.
 */
export function Plan2D({
  room,
  items = [],
  selectedId = null,
  onSelect,
}: Plan2DProps) {
  const [resetToken, setResetToken] = useState(0)

  return (
    <div className="relative h-full w-full">
      <Canvas
        orthographic
        flat
        dpr={[1, 2]}
        gl={{ antialias: true }}
        onPointerMissed={onSelect ? () => onSelect(null) : undefined}
        style={{ touchAction: 'none' }}
      >
        <FitOrthoCamera room={room} />
        <RoomScene
          room={room}
          items={items}
          selectedId={selectedId}
          onSelect={onSelect}
          renderLabel={(item, selected) => (
            <ItemLabel item={item} selected={selected} />
          )}
        />
        <PlanControls room={room} resetToken={resetToken} />
      </Canvas>

      <Button
        type="button"
        variant="secondary"
        size="sm"
        className="absolute top-2 right-2 z-10 shadow-sm"
        onClick={() => setResetToken((token) => token + 1)}
        title="Fit the room back into view"
      >
        <RotateCcw aria-hidden="true" />
        Reset view
      </Button>
    </div>
  )
}
