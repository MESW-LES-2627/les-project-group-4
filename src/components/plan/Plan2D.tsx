'use client'

import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ComponentRef,
  type RefObject,
} from 'react'
import { MapControls, OrthographicCamera } from '@react-three/drei'
import { Canvas, useThree } from '@react-three/fiber'
import {
  Maximize2,
  Minimize2,
  RotateCcw,
  ZoomIn,
  ZoomOut,
} from 'lucide-react'
import type { OrthographicCamera as OrthographicCameraImpl } from 'three'

import { Button } from '@/components/ui/button'
import type { RoomSize } from '@/lib/geometry/plan'
import type { PlacedItem as PlacedItemData } from '@/lib/layout/layout'

import { ItemLabel } from './ItemLabel'
import {
  CAMERA_HEIGHT_M,
  MAX_ZOOM,
  MIN_ZOOM,
  fitOrthoFrustum,
  planViewPose,
  stepZoom,
  type ZoomDirection,
} from './ortho'
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
  const cameraRef = useRef<OrthographicCameraImpl>(null)
  const frustum = fitOrthoFrustum(room, size.width / size.height)
  const { position } = planViewPose(room)
  const { left, right, top, bottom } = frustum

  useLayoutEffect(() => {
    cameraRef.current?.updateProjectionMatrix()
  }, [left, right, top, bottom])

  return (
    <OrthographicCamera
      ref={cameraRef}
      // R3F resizes the default camera in pixels on every canvas resize,
      // which would clobber the world-unit frustum below. Fit it ourselves.
      manual
      makeDefault
      position={position}
      rotation={[-Math.PI / 2, 0, 0]}
      up={[0, 0, -1]}
      left={left}
      right={right}
      top={top}
      bottom={bottom}
      near={0.1}
      far={100}
    />
  )
}

function PlanControls({
  room,
  controlsRef,
  resetToken,
}: {
  room: RoomSize
  controlsRef: RefObject<ComponentRef<typeof MapControls> | null>
  resetToken: number
}) {
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
  }, [controlsRef, centerX, centerZ, resetToken])

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
      minZoom={MIN_ZOOM}
      maxZoom={MAX_ZOOM}
    />
  )
}

/**
 * The 2D plan mode: an orthographic top-down camera over the shared
 * camera-agnostic RoomScene. MapControls pans and zooms but never rotates,
 * and the overlay controls reset, zoom and expand the view.
 */
export function Plan2D({
  room,
  items = [],
  selectedId = null,
  onSelect,
}: Plan2DProps) {
  const controlsRef = useRef<ComponentRef<typeof MapControls>>(null)
  const [resetToken, setResetToken] = useState(0)
  const [isFullscreen, setIsFullscreen] = useState(false)

  // While expanded, lock page scrolling and let Escape close the plan.
  useEffect(() => {
    if (!isFullscreen) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setIsFullscreen(false)
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = previousOverflow
    }
  }, [isFullscreen])

  function toggleFullscreen() {
    // Expanding changes the viewport aspect, so start from the fitted view.
    if (!isFullscreen) setResetToken((token) => token + 1)
    setIsFullscreen(!isFullscreen)
  }

  function zoom(direction: ZoomDirection) {
    const controls = controlsRef.current
    if (!controls) return

    const camera = controls.object as OrthographicCameraImpl
    camera.zoom = stepZoom(camera.zoom, direction)
    camera.updateProjectionMatrix()
  }

  return (
    <div
      className={
        isFullscreen
          ? 'fixed inset-0 z-50 h-dvh bg-secondary'
          : 'relative h-full w-full'
      }
    >
      <div className="pointer-events-none absolute inset-0 opacity-70 bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] bg-size-[16px_16px]" />

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
        <PlanControls
          room={room}
          controlsRef={controlsRef}
          resetToken={resetToken}
        />
      </Canvas>

      <div className="absolute top-2 right-2 z-10 flex items-center gap-1.5">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="shadow-sm"
          onClick={() => setResetToken((token) => token + 1)}
          title="Fit the room back into view"
        >
          <RotateCcw aria-hidden="true" />
          Reset view
        </Button>
        <Button
          type="button"
          variant="secondary"
          size="icon-sm"
          className="shadow-sm"
          onClick={toggleFullscreen}
          aria-label={isFullscreen ? 'Exit full screen' : 'Enter full screen'}
          title={isFullscreen ? 'Exit full screen' : 'Enter full screen'}
        >
          {isFullscreen ? (
            <Minimize2 aria-hidden="true" />
          ) : (
            <Maximize2 aria-hidden="true" />
          )}
        </Button>
      </div>

      <div className="absolute right-2 bottom-2 z-10 flex flex-col gap-1.5">
        <Button
          type="button"
          variant="secondary"
          size="icon-sm"
          className="shadow-sm"
          onClick={() => zoom('in')}
          aria-label="Zoom in"
          title="Zoom in"
        >
          <ZoomIn aria-hidden="true" />
        </Button>
        <Button
          type="button"
          variant="secondary"
          size="icon-sm"
          className="shadow-sm"
          onClick={() => zoom('out')}
          aria-label="Zoom out"
          title="Zoom out"
        >
          <ZoomOut aria-hidden="true" />
        </Button>
      </div>
    </div>
  )
}
