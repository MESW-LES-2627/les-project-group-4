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
import { Canvas, useThree, type RootState } from '@react-three/fiber'
import {
  Maximize2,
  Minimize2,
  RotateCcw,
  ZoomIn,
  ZoomOut,
} from 'lucide-react'
import { Vector3 } from 'three'
import type { OrthographicCamera as OrthographicCameraImpl } from 'three'

import { Button } from '@/components/ui/button'
import type { RoomSize } from '@/features/plan/model/geometry'
import type { PlacedItem as PlacedItemData } from '@/features/plan/model/layout'
import type { PlacedItemSource } from '@/features/plan/types'

import { DimensionLabels, DimensionProjector } from './DimensionLabels'
import { PlanGrid, PlanGridProjector } from './PlanGrid'
import { ScaleBar, ScaleBarProjector } from './ScaleBar'
import { ItemLabels, ItemLabelProjector } from './ItemLabels'
import {
  CAMERA_HEIGHT_M,
  MAX_ZOOM,
  MIN_ZOOM,
  fitOrthoFrustum,
  planViewPose,
  stepZoom,
  type ZoomDirection,
} from '@/features/plan/model/ortho'
import { RoomScene, type RoomSceneProps } from './scene/RoomScene'

export interface Plan2DProps {
  room: RoomSize
  items?: PlacedItemData[]
  selectedId?: string | null
  onSelect?: (id: string | null) => void
  onDropItem?: (item: PlacedItemSource, xCm: number, yCm: number) => void
}

export type Plan2DSceneProps = Plan2DProps &
  Pick<RoomSceneProps, 'renderLabel'>

/**
 * The R3F subtree Plan2D mounts inside its Canvas. It is exported separately
 * so the renderer test can mount it without a DOM/WebGL canvas (AT-5).
 */
export function Plan2DScene({
  room,
  items = [],
  selectedId = null,
  onSelect,
  renderLabel,
}: Plan2DSceneProps) {
  return (
    <RoomScene
      room={room}
      items={items}
      selectedId={selectedId}
      onSelect={onSelect}
      renderLabel={renderLabel}
    />
  )
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
  onDropItem,
}: Plan2DProps) {
  const controlsRef = useRef<ComponentRef<typeof MapControls>>(null)
  const widthLabelRef = useRef<HTMLDivElement>(null)
  const depthLabelRef = useRef<HTMLDivElement>(null)
  const scaleLineRef = useRef<HTMLDivElement>(null)
  const scaleTextRef = useRef<HTMLSpanElement>(null)
  const gridRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasStateRef = useRef<RootState | null>(null)
  const dragCounterRef = useRef(0)
  const [labelRefs] = useState(() => new Map<string, HTMLDivElement | null>())
  const [resetToken, setResetToken] = useState(0)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isDragOver, setIsDragOver] = useState(false)

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

  function resetView() {
    setResetToken((token) => token + 1)
  }

  function toggleFullscreen() {
    // Expanding changes the viewport aspect, so start from the fitted view.
    if (!isFullscreen) resetView()
    setIsFullscreen(!isFullscreen)
  }

  function zoom(direction: ZoomDirection) {
    const controls = controlsRef.current
    if (!controls) return

    const camera = controls.object as OrthographicCameraImpl
    camera.zoom = stepZoom(camera.zoom, direction)
    camera.updateProjectionMatrix()
  }

  function parseDragItem(dataTransfer: DataTransfer): PlacedItemSource | null {
    const raw = dataTransfer.getData('application/json')
    if (!raw) return null
    try {
      return JSON.parse(raw) as PlacedItemSource
    } catch {
      return null
    }
  }

  function handleDragEnter(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault()
    if (!onDropItem) return
    dragCounterRef.current += 1
    setIsDragOver(true)
  }

  function handleDragLeave(_event: React.DragEvent<HTMLDivElement>) {
    if (!onDropItem) return
    dragCounterRef.current -= 1
    if (dragCounterRef.current <= 0) {
      dragCounterRef.current = 0
      setIsDragOver(false)
    }
  }

  function handleDragOver(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'copy'
  }

  function handleDrop(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault()
    dragCounterRef.current = 0
    setIsDragOver(false)

    if (!onDropItem || !containerRef.current || !canvasStateRef.current) return

    const item = parseDragItem(event.dataTransfer)
    if (!item) return

    const rect = containerRef.current.getBoundingClientRect()
    const ndcX = ((event.clientX - rect.left) / rect.width) * 2 - 1
    const ndcY = -((event.clientY - rect.top) / rect.height) * 2 + 1

    const { camera } = canvasStateRef.current
    const point = new Vector3(ndcX, ndcY, 0).unproject(camera)

    onDropItem(item, point.x * 100, point.z * 100)
  }

  return (
    <div
      ref={containerRef}
      className={
        isFullscreen
          ? 'fixed inset-0 z-50 h-dvh bg-secondary'
          : 'relative h-full w-full'
      }
      onDragEnter={onDropItem ? handleDragEnter : undefined}
      onDragLeave={onDropItem ? handleDragLeave : undefined}
      onDragOver={onDropItem ? handleDragOver : undefined}
      onDrop={onDropItem ? handleDrop : undefined}
    >
      <PlanGrid gridRef={gridRef} />

      <Canvas
        orthographic
        flat
        dpr={[1, 2]}
        gl={{ antialias: true }}
        onPointerMissed={onSelect ? () => onSelect(null) : undefined}
        // Double-clicking anywhere on the plan is a quick "fit to room".
        onDoubleClick={resetView}
        style={{ touchAction: 'none' }}
        onCreated={(state) => {
          canvasStateRef.current = state
        }}
      >
        <FitOrthoCamera room={room} />
        <DimensionProjector
          room={room}
          widthRef={widthLabelRef}
          depthRef={depthLabelRef}
        />
        <ScaleBarProjector lineRef={scaleLineRef} textRef={scaleTextRef} />
        <PlanGridProjector gridRef={gridRef} />
        <Plan2DScene
          room={room}
          items={items}
          selectedId={selectedId}
          onSelect={onSelect}
        />
        <ItemLabelProjector items={items} labelRefs={labelRefs} />
        <PlanControls
          room={room}
          controlsRef={controlsRef}
          resetToken={resetToken}
        />
      </Canvas>

      <DimensionLabels
        room={room}
        widthRef={widthLabelRef}
        depthRef={depthLabelRef}
      />
      <ScaleBar lineRef={scaleLineRef} textRef={scaleTextRef} />
      <ItemLabels
        items={items}
        selectedId={selectedId}
        labelRefs={labelRefs}
      />

      <div className="absolute top-2 right-2 z-10 flex items-center gap-1.5">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="shadow-sm"
          onClick={resetView}
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

      {isDragOver ? (
        <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center bg-primary/10">
          <span className="rounded-full bg-background/90 px-3 py-1.5 text-sm font-medium text-foreground shadow-sm">
            Drop here to place
          </span>
        </div>
      ) : null}
    </div>
  )
}
