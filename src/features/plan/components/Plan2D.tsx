'use client'

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ComponentRef,
  type RefObject,
} from 'react'
import { MapControls, OrthographicCamera } from '@react-three/drei'
import { Canvas, useThree, type RootState, type ThreeEvent } from '@react-three/fiber'
import {
  Maximize2,
  Minimize2,
  RotateCcw,
  ZoomIn,
  ZoomOut,
} from 'lucide-react'
import { Plane, Vector3 } from 'three'
import type { OrthographicCamera as OrthographicCameraImpl } from 'three'

import { Button } from '@/components/ui/button'
import type { Placement, Point, RoomSize } from '@/features/plan/model/geometry'
import type { PlacedItem as PlacedItemData } from '@/features/plan/model/layout'
import { dragPlacement } from '@/features/plan/model/manipulation'
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

/** The plan floor: y = 0 in R3F scene space. */
const FLOOR_PLANE = new Plane(new Vector3(0, 1, 0), 0)

interface DragSession {
  id: string
  pointerId: number
  /** Where the pointer grabbed the item, relative to its centre, in cm. */
  grabOffsetCm: Point
  startPlacement: Placement
  preview: Placement
  moved: boolean
}

export interface Plan2DProps {
  room: RoomSize
  items?: PlacedItemData[]
  selectedId?: string | null
  onSelect?: (id: string | null) => void
  onDropItem?: (item: PlacedItemSource, xCm: number, yCm: number) => void
  onMoveItem?: (id: string, placement: Placement) => void
}

export type Plan2DSceneProps = Plan2DProps &
  Pick<
    RoomSceneProps,
    | 'renderLabel'
    | 'onItemPointerDown'
    | 'onItemPointerMove'
    | 'onItemPointerUp'
    | 'onItemPointerCancel'
  >

/**
 * The R3F subtree Plan2D mounts inside its Canvas. It is exported separately
 * so the renderer test can mount it without a DOM/WebGL canvas (AT-5).
 */
export function Plan2DScene({
  room,
  items = [],
  selectedId = null,
  onSelect,
  onItemPointerDown,
  onItemPointerMove,
  onItemPointerUp,
  onItemPointerCancel,
  renderLabel,
}: Plan2DSceneProps) {
  return (
    <RoomScene
      room={room}
      items={items}
      selectedId={selectedId}
      onSelect={onSelect}
      onItemPointerDown={onItemPointerDown}
      onItemPointerMove={onItemPointerMove}
      onItemPointerUp={onItemPointerUp}
      onItemPointerCancel={onItemPointerCancel}
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
  onMoveItem,
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
  const dragRef = useRef<DragSession | null>(null)
  const floorPointRef = useRef(new Vector3())
  const suppressMissedRef = useRef(false)
  const [labelRefs] = useState(() => new Map<string, HTMLDivElement | null>())
  const [resetToken, setResetToken] = useState(0)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isDragOver, setIsDragOver] = useState(false)
  const [drag, setDrag] = useState<DragSession | null>(null)

  const displayItems =
    drag === null
      ? items
      : items.map((item) =>
          item.id === drag.id ? { ...item, ...drag.preview } : item,
        )

  const setControlsEnabled = useCallback((enabled: boolean) => {
    const controls = controlsRef.current
    if (controls) controls.enabled = enabled
  }, [])

  const finishDrag = useCallback(
    (commit: boolean) => {
      const session = dragRef.current
      if (session === null) return

      dragRef.current = null
      setDrag(null)
      setControlsEnabled(true)

      if (!commit) return

      // A drag is a transient selection: the item is highlighted while it moves,
      // then the plan is left with nothing selected. A click without movement is
      // still a normal selection and keeps the item selected.
      if (!session.moved) {
        onSelect?.(session.id)
        return
      }

      suppressMissedRef.current = true
      onSelect?.(null)
      onMoveItem?.(session.id, session.preview)
    },
    [onMoveItem, onSelect, setControlsEnabled],
  )

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

  // End the drag even when R3F's pointerup misses the item (for example, the
  // cursor is released outside the canvas). Pointer capture normally forwards
  // the event, but this keeps the drag from surviving a lost pointerup.
  useEffect(() => {
    const pointerId = drag?.pointerId
    if (pointerId === undefined) return

    function handlePointerUp(event: PointerEvent) {
      if (event.pointerId === pointerId) finishDrag(true)
    }

    function handlePointerCancel(event: PointerEvent) {
      if (event.pointerId === pointerId) finishDrag(false)
    }

    window.addEventListener('pointerup', handlePointerUp)
    window.addEventListener('pointercancel', handlePointerCancel)
    return () => {
      window.removeEventListener('pointerup', handlePointerUp)
      window.removeEventListener('pointercancel', handlePointerCancel)
    }
  }, [drag?.pointerId, finishDrag])

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

  /** The pointer ray's intersection with the floor, in room centimetres. */
  function roomPoint(event: ThreeEvent<PointerEvent>): Point | null {
    const hit = event.ray.intersectPlane(FLOOR_PLANE, floorPointRef.current)
    if (hit === null) return null
    return { x: hit.x * 100, y: hit.z * 100 }
  }

  function capturePointer(event: ThreeEvent<PointerEvent>) {
    const target = event.target as unknown as {
      setPointerCapture(id: number): void
    }
    target.setPointerCapture(event.pointerId)
  }

  function releasePointer(event: ThreeEvent<PointerEvent>) {
    const target = event.target as unknown as {
      hasPointerCapture(id: number): boolean
      releasePointerCapture(id: number): void
    }
    if (target.hasPointerCapture(event.pointerId)) {
      target.releasePointerCapture(event.pointerId)
    }
  }

  function handleItemPointerDown(
    item: PlacedItemData,
    event: ThreeEvent<PointerEvent>,
  ) {
    if (!onMoveItem || dragRef.current !== null || event.button !== 0) return

    const point = roomPoint(event)
    if (point === null) return

    event.stopPropagation()
    setControlsEnabled(false)
    capturePointer(event)
    onSelect?.(item.id)

    const startPlacement: Placement = {
      xCm: item.xCm,
      yCm: item.yCm,
      rotationDeg: item.rotationDeg,
    }
    const session: DragSession = {
      id: item.id,
      pointerId: event.pointerId,
      grabOffsetCm: { x: item.xCm - point.x, y: item.yCm - point.y },
      startPlacement,
      preview: startPlacement,
      moved: false,
    }
    dragRef.current = session
    setDrag(session)
  }

  function handleItemPointerMove(
    item: PlacedItemData,
    event: ThreeEvent<PointerEvent>,
  ) {
    const session = dragRef.current
    if (
      session === null ||
      session.pointerId !== event.pointerId ||
      session.id !== item.id
    ) {
      return
    }

    const point = roomPoint(event)
    if (point === null) return

    event.stopPropagation()
    const preview = dragPlacement(
      item,
      session.startPlacement,
      point,
      session.grabOffsetCm,
      room,
      0,
    )
    const moved =
      session.moved ||
      preview.xCm !== session.startPlacement.xCm ||
      preview.yCm !== session.startPlacement.yCm
    const next = { ...session, preview, moved }
    dragRef.current = next
    setDrag(next)
  }

  function handleItemPointerUp(
    item: PlacedItemData,
    event: ThreeEvent<PointerEvent>,
  ) {
    const session = dragRef.current
    if (
      session === null ||
      session.pointerId !== event.pointerId ||
      session.id !== item.id
    ) {
      return
    }

    event.stopPropagation()
    releasePointer(event)
    finishDrag(true)
  }

  function handleItemPointerCancel(
    item: PlacedItemData,
    event: ThreeEvent<PointerEvent>,
  ) {
    const session = dragRef.current
    if (
      session === null ||
      session.pointerId !== event.pointerId ||
      session.id !== item.id
    ) {
      return
    }

    releasePointer(event)
    finishDrag(false)
  }

  function handlePointerMissed() {
    if (suppressMissedRef.current) {
      suppressMissedRef.current = false
      return
    }
    onSelect?.(null)
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
      onPointerDownCapture={() => {
        suppressMissedRef.current = false
      }}
    >
      <PlanGrid gridRef={gridRef} />

      <Canvas
        orthographic
        flat
        dpr={[1, 2]}
        gl={{ antialias: true }}
        onPointerMissed={onSelect ? handlePointerMissed : undefined}
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
          items={displayItems}
          selectedId={selectedId}
          onSelect={onSelect}
          onItemPointerDown={handleItemPointerDown}
          onItemPointerMove={handleItemPointerMove}
          onItemPointerUp={handleItemPointerUp}
          onItemPointerCancel={handleItemPointerCancel}
        />
        <ItemLabelProjector items={displayItems} labelRefs={labelRefs} />
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
        items={displayItems}
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
