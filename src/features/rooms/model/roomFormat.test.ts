import { describe, expect, it } from 'vitest'

import { describeRoomDeletion, formatArea } from './roomFormat'

describe('formatArea', () => {
  it('converts square centimetres to square metres', () => {
    expect(formatArea({ widthCm: 400, lengthCm: 300 })).toBe('12 m²')
  })

  it('keeps at most one decimal place', () => {
    expect(formatArea({ widthCm: 350, lengthCm: 250 })).toBe('8.8 m²')
  })

  it('groups thousands', () => {
    expect(formatArea({ widthCm: 4000, lengthCm: 3500 })).toBe('1,400 m²')
  })
})

describe('describeRoomDeletion', () => {
  it('only warns that it cannot be undone when there are no saved layouts', () => {
    expect(describeRoomDeletion(0)).toBe('This cannot be undone.')
  })

  it('names the saved layouts that go with the room', () => {
    expect(describeRoomDeletion(1)).toBe('This also deletes its saved layout. This cannot be undone.')
    expect(describeRoomDeletion(3)).toBe('This also deletes its 3 saved layouts. This cannot be undone.')
  })
})
