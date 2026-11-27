// @vitest-environment jsdom

import { act, cleanup, renderHook } from '@testing-library/react'
import type { ThreeEvent } from '@react-three/fiber'
import { afterEach, describe, expect, it, vi } from 'vitest'

import type { RoomSize } from '@/features/plan/model/geometry'
import type { PlacedItem as PlacedItemData } from '@/features/plan/model/layout'

import { usePlanDrag, type UsePlanDragOptions } from './usePlanDrag'

// The file-level jsdom environment does not load vitest.setup.dom.ts.
afterEach(cleanup)

const room: RoomSize = { widthCm: 300, lengthCm: 200 }

const sofa: PlacedItemData = {
  id: 'sofa-1',
  catalogItemId: 12,
  name: 'Sofa',
  widthCm: 100,
  depthCm: 50,
  priceCents: 49900,
  xCm: 150,
  yCm: 100,
  rotationDeg: 0,
}

/** A ThreeEvent stand-in: the hook only reads pointer identity, buttons and client px. */
function pointerEvent(
  clientX: number,
  clientY: number,
  overrides: { pointerId?: number; button?: number } = {},
): ThreeEvent<PointerEvent> {
  return {
    pointerId: overrides.pointerId ?? 1,
    button: overrides.button ?? 0,
    clientX,
    clientY,
    stopPropagation: vi.fn(),
  } as unknown as ThreeEvent<PointerEvent>
}

/** The test room maps one screen pixel to one room centimetre. */
function roomPoint(event: ThreeEvent<PointerEvent>) {
  return { x: event.clientX, y: event.clientY }
}

function setup(overrides: Partial<UsePlanDragOptions> = {}) {
  const onSelect = vi.fn()
  const onMoveItem = vi.fn()
  const onRotateItem = vi.fn()
  const onDraggingChange = vi.fn()
  const capturePointer = vi.fn()
  const releasePointer = vi.fn()
  const options: UsePlanDragOptions = {
    room,
    items: [sofa],
    selectedId: null,
    onSelect,
    onMoveItem,
    onRotateItem,
    onDraggingChange,
    roomPoint,
    capturePointer,
    releasePointer,
    ...overrides,
  }

  const view = renderHook((props: UsePlanDragOptions) => usePlanDrag(props), {
    initialProps: options,
  })

  return {
    ...view,
    options,
    onSelect,
    onMoveItem,
    onRotateItem,
    onDraggingChange,
    capturePointer,
    releasePointer,
  }
}

describe('usePlanDrag', () => {
  it('only selects an unselected item on click, even after the parent re-renders', () => {
    const { result, rerender, options, onSelect, onRotateItem, onMoveItem } =
      setup()

    act(() => {
      result.current.handleItemPointerDown(sofa, pointerEvent(150, 100))
    })
    expect(onSelect).toHaveBeenLastCalledWith('sofa-1')
    expect(result.current.drag?.wasSelected).toBe(false)

    // The parent applies the selection from pointerdown before the pointerup
    // arrives; that must not turn the click into a rotation.
    rerender({ ...options, selectedId: 'sofa-1' })

    act(() => {
      result.current.handleItemPointerUp(sofa, pointerEvent(150, 100))
    })

    expect(onRotateItem).not.toHaveBeenCalled()
    expect(onMoveItem).not.toHaveBeenCalled()
    expect(onSelect).toHaveBeenLastCalledWith('sofa-1')
    expect(result.current.drag).toBeNull()
  })

  it('rotates a selected item clicked again without moving', () => {
    const { result, onRotateItem, onMoveItem, onSelect } = setup({
      selectedId: 'sofa-1',
    })

    act(() => {
      result.current.handleItemPointerDown(sofa, pointerEvent(150, 100))
    })
    act(() => {
      result.current.handleItemPointerUp(sofa, pointerEvent(150, 100))
    })

    expect(onRotateItem).toHaveBeenCalledWith('sofa-1')
    expect(onMoveItem).not.toHaveBeenCalled()
    expect(onSelect).not.toHaveBeenLastCalledWith(null)
  })

  it('moves the item with a drag and commits the preview on release', () => {
    const { result, onSelect, onMoveItem, onDraggingChange } = setup()

    act(() => {
      result.current.handleItemPointerDown(sofa, pointerEvent(150, 100))
    })
    expect(onDraggingChange).toHaveBeenLastCalledWith(true)

    act(() => {
      result.current.handleItemPointerMove(sofa, pointerEvent(200, 140))
    })
    expect(result.current.drag?.moved).toBe(true)
    expect(result.current.drag?.preview).toEqual({
      xCm: 200,
      yCm: 140,
      rotationDeg: 0,
    })
    expect(result.current.displayItems[0]).toMatchObject({
      id: 'sofa-1',
      xCm: 200,
      yCm: 140,
    })

    act(() => {
      result.current.handleItemPointerUp(sofa, pointerEvent(200, 140))
    })

    expect(onSelect).toHaveBeenLastCalledWith(null)
    expect(onMoveItem).toHaveBeenCalledWith('sofa-1', {
      xCm: 200,
      yCm: 140,
      rotationDeg: 0,
    })
    expect(onDraggingChange).toHaveBeenLastCalledWith(false)
    expect(result.current.drag).toBeNull()
  })

  it('keeps the grabbed point under the pointer', () => {
    const { result } = setup()

    // The pointer grabs the item 10 cm right of its centre.
    act(() => {
      result.current.handleItemPointerDown(sofa, pointerEvent(160, 100))
    })
    act(() => {
      result.current.handleItemPointerMove(sofa, pointerEvent(190, 120))
    })

    expect(result.current.drag?.preview).toEqual({
      xCm: 180,
      yCm: 120,
      rotationDeg: 0,
    })
  })

  it('treats a little jitter as a click on an unselected item', () => {
    const { result, onSelect, onMoveItem, onRotateItem } = setup()

    act(() => {
      result.current.handleItemPointerDown(sofa, pointerEvent(150, 100))
    })
    act(() => {
      result.current.handleItemPointerMove(sofa, pointerEvent(152, 101))
      result.current.handleItemPointerUp(sofa, pointerEvent(152, 101))
    })

    expect(result.current.displayItems).toEqual([sofa])
    expect(onMoveItem).not.toHaveBeenCalled()
    expect(onRotateItem).not.toHaveBeenCalled()
    expect(onSelect).toHaveBeenLastCalledWith('sofa-1')
  })

  it('treats a little jitter as a click that still rotates a selected item', () => {
    const { result, onMoveItem, onRotateItem } = setup({
      selectedId: 'sofa-1',
    })

    act(() => {
      result.current.handleItemPointerDown(sofa, pointerEvent(150, 100))
    })
    act(() => {
      result.current.handleItemPointerMove(sofa, pointerEvent(151, 102))
      result.current.handleItemPointerUp(sofa, pointerEvent(151, 102))
    })

    expect(onRotateItem).toHaveBeenCalledWith('sofa-1')
    expect(onMoveItem).not.toHaveBeenCalled()
  })

  it('does not commit a cancelled drag', () => {
    const { result, onSelect, onMoveItem } = setup()

    act(() => {
      result.current.handleItemPointerDown(sofa, pointerEvent(150, 100))
    })
    act(() => {
      result.current.handleItemPointerMove(sofa, pointerEvent(220, 160))
    })
    act(() => {
      result.current.handleItemPointerCancel(sofa, pointerEvent(220, 160))
    })

    expect(onMoveItem).not.toHaveBeenCalled()
    expect(onSelect).toHaveBeenLastCalledWith('sofa-1')
    expect(result.current.drag).toBeNull()
    expect(result.current.displayItems).toEqual([sofa])
  })

  it('captures the pointer on down and releases it on up', () => {
    const { result, capturePointer, releasePointer } = setup()
    const down = pointerEvent(150, 100)
    const up = pointerEvent(150, 100)

    act(() => {
      result.current.handleItemPointerDown(sofa, down)
    })
    expect(capturePointer).toHaveBeenCalledWith(down)

    act(() => {
      result.current.handleItemPointerUp(sofa, up)
    })
    expect(releasePointer).toHaveBeenCalledWith(up)
  })

  it('ignores a right click', () => {
    const { result, onSelect } = setup()

    act(() => {
      result.current.handleItemPointerDown(
        sofa,
        pointerEvent(150, 100, { button: 2 }),
      )
    })

    expect(result.current.drag).toBeNull()
    expect(onSelect).not.toHaveBeenCalled()
  })

  it('does nothing when the pointer misses the floor', () => {
    const { result, onSelect } = setup({ roomPoint: () => null })

    act(() => {
      result.current.handleItemPointerDown(sofa, pointerEvent(150, 100))
    })

    expect(result.current.drag).toBeNull()
    expect(onSelect).not.toHaveBeenCalled()
  })

  it('ignores events for another pointer or another item', () => {
    const { result } = setup()

    act(() => {
      result.current.handleItemPointerDown(sofa, pointerEvent(150, 100))
    })
    act(() => {
      result.current.handleItemPointerMove(sofa, pointerEvent(200, 140))
    })
    const preview = result.current.drag?.preview

    act(() => {
      result.current.handleItemPointerMove(
        { ...sofa, id: 'chair-1' },
        pointerEvent(220, 160),
      )
      result.current.handleItemPointerMove(
        sofa,
        pointerEvent(220, 160, { pointerId: 2 }),
      )
      result.current.handleItemPointerUp(
        sofa,
        pointerEvent(220, 160, { pointerId: 2 }),
      )
    })

    expect(result.current.drag?.preview).toEqual(preview)
    expect(result.current.drag).not.toBeNull()
  })

  it('clears the selection when the empty floor is clicked', () => {
    const { result, onSelect } = setup()

    act(() => {
      result.current.handlePointerMissed()
    })

    expect(onSelect).toHaveBeenCalledWith(null)
  })

  it('does not clear the selection again because of the drop that just ended', () => {
    const { result, onSelect } = setup()

    act(() => {
      result.current.handleItemPointerDown(sofa, pointerEvent(150, 100))
    })
    act(() => {
      result.current.handleItemPointerMove(sofa, pointerEvent(200, 140))
      result.current.handleItemPointerUp(sofa, pointerEvent(200, 140))
    })
    expect(onSelect).toHaveBeenLastCalledWith(null)
    onSelect.mockClear()

    act(() => {
      result.current.handlePointerMissed()
    })
    expect(onSelect).not.toHaveBeenCalled()

    // The next pointerdown re-arms it for the following empty-floor click.
    act(() => {
      result.current.resetPointerMissed()
      result.current.handlePointerMissed()
    })
    expect(onSelect).toHaveBeenCalledWith(null)
  })
})
