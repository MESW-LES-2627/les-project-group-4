import { describe, expect, it } from 'vitest'

import { formatArea } from './roomFormat'

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
