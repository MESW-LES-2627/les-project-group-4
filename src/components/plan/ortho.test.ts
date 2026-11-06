import { describe, expect, it } from 'vitest'

import {
  MAX_ZOOM,
  MIN_ZOOM,
  fitOrthoFrustum,
  niceScaleMetres,
  planScale,
  planViewPose,
  stepZoom,
} from './ortho'

const room = { widthCm: 300, lengthCm: 400 }
const width = (frustum: ReturnType<typeof fitOrthoFrustum>) => frustum.right - frustum.left
const height = (frustum: ReturnType<typeof fitOrthoFrustum>) => frustum.top - frustum.bottom

describe('planViewPose', () => {
  it('puts the camera above the room centre, looking down at it', () => {
    const pose = planViewPose(room)

    expect(pose.position).toEqual([1.5, 10, 2])
    expect(pose.target).toEqual([1.5, 0, 2])
  })

  it('centres the view for any room size', () => {
    const pose = planViewPose({ widthCm: 120, lengthCm: 250 })

    expect(pose.position[0]).toBeCloseTo(0.6)
    expect(pose.position[2]).toBeCloseTo(1.25)
    expect(pose.target).toEqual([pose.position[0], 0, pose.position[2]])
  })
})

describe('stepZoom', () => {
  it('zooms in and out by one step', () => {
    expect(stepZoom(1, 'in')).toBeCloseTo(1.25)
    expect(stepZoom(1, 'out')).toBeCloseTo(0.8)
  })

  it('clamps to the controls limits', () => {
    expect(stepZoom(MAX_ZOOM, 'in')).toBe(MAX_ZOOM)
    expect(stepZoom(MIN_ZOOM, 'out')).toBe(MIN_ZOOM)
  })

  it('does not overshoot the limits from just inside them', () => {
    expect(stepZoom(MAX_ZOOM / 1.1, 'in')).toBe(MAX_ZOOM)
    expect(stepZoom(MIN_ZOOM * 1.1, 'out')).toBe(MIN_ZOOM)
  })
})

describe('niceScaleMetres', () => {
  it.each([
    [1.9, 1],
    [2, 2],
    [4.9, 2],
    [5, 5],
    [9.9, 5],
    [12, 10],
    [0.9, 0.5],
    [0.35, 0.2],
  ])('rounds %s down to the largest 1/2/5 step', (max, expected) => {
    expect(niceScaleMetres(max)).toBeCloseTo(expected)
  })

  it('falls back to 0.1 m for invalid input', () => {
    expect(niceScaleMetres(0)).toBe(0.1)
    expect(niceScaleMetres(-5)).toBe(0.1)
    expect(niceScaleMetres(Number.NaN)).toBe(0.1)
    expect(niceScaleMetres(Number.POSITIVE_INFINITY)).toBe(0.1)
  })
})

describe('planScale', () => {
  it.each([
    [87, 1],
    [190, 0.5],
    [43.5, 2],
    [696, 0.1],
    [20, 5],
  ])('picks a round bar length at %s px/m', (pxPerMetre, metres) => {
    expect(planScale(pxPerMetre).metres).toBeCloseTo(metres)
    expect(planScale(pxPerMetre).px).toBeCloseTo(metres * pxPerMetre)
  })

  it('keeps the bar between 40% and 100% of its target width', () => {
    for (const pxPerMetre of [20, 43.5, 87, 190, 400, 696]) {
      const { px } = planScale(pxPerMetre)

      expect(px).toBeGreaterThanOrEqual(40)
      expect(px).toBeLessThanOrEqual(110)
    }
  })

  it('falls back to a 1 m bar for invalid scales', () => {
    expect(planScale(0)).toEqual({ metres: 1, px: 0 })
    expect(planScale(-1)).toEqual({ metres: 1, px: 0 })
    expect(planScale(Number.NaN)).toEqual({ metres: 1, px: 0 })
  })
})

describe('fitOrthoFrustum', () => {
  it('exactly fills a matching 3:4 viewport when there is no padding', () => {
    const frustum = fitOrthoFrustum(room, 0.75, 0)

    expect(width(frustum)).toBeCloseTo(3)
    expect(height(frustum)).toBeCloseTo(4)
    expect(frustum.left).toBeCloseTo(-1.5)
    expect(frustum.right).toBeCloseTo(1.5)
    expect(frustum.bottom).toBeCloseTo(-2)
    expect(frustum.top).toBeCloseTo(2)
  })

  it('adds padding on both axes without changing the room proportions', () => {
    const frustum = fitOrthoFrustum(room, 1, 0.5)

    // square viewport must fit the 4m + 1m depth so both sides are 5m
    expect(width(frustum)).toBeCloseTo(5)
    expect(height(frustum)).toBeCloseTo(5)
  })

  it('keeps the room visible and the viewport aspect at every size', () => {
    const roomWidthM = room.widthCm / 100
    const roomDepthM = room.lengthCm / 100
    const paddingM = 0.4

    for (const aspect of [0.5, 0.75, 1, 16 / 9, 2]) {
      const frustum = fitOrthoFrustum(room, aspect)

      expect(width(frustum)).toBeGreaterThanOrEqual(roomWidthM + 2 * paddingM)
      expect(height(frustum)).toBeGreaterThanOrEqual(roomDepthM + 2 * paddingM)
      expect(width(frustum) / height(frustum)).toBeCloseTo(aspect, 6)
      expect(frustum.left).toBeCloseTo(-frustum.right)
      expect(frustum.bottom).toBeCloseTo(-frustum.top)
    }
  })

  it('uses extra space on the wider axis instead of stretching the room', () => {
    const wideRoom = { widthCm: 600, lengthCm: 200 }

    const frustum = fitOrthoFrustum(wideRoom, 1, 0)

    expect(width(frustum)).toBeCloseTo(6)
    expect(height(frustum)).toBeCloseTo(6)
  })

  it('clamps negative padding to zero', () => {
    expect(fitOrthoFrustum(room, 1, -5)).toEqual(fitOrthoFrustum(room, 1, 0))
  })

  it.each([0, -1, Number.NaN, Number.POSITIVE_INFINITY])(
    'falls back to a square frustum for invalid aspect %s',
    (aspect) => {
      expect(fitOrthoFrustum(room, aspect)).toEqual(fitOrthoFrustum(room, 1))
    },
  )
})
