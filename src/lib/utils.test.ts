import { describe, expect, it } from 'vitest'

import { formatPriceCents } from './utils'

describe('formatPriceCents', () => {
  it('formats integer cents as euros', () => {
    // pt-PT uses a comma decimal separator and a (non-breaking) space before €.
    expect(formatPriceCents(34900).replace(/\s/g, ' ')).toBe('349,00 €')
    expect(formatPriceCents(5).replace(/\s/g, ' ')).toBe('0,05 €')
  })

  it('formats zero and large prices with a space between thousands (pt-PT)', () => {
    const fmt = (cents: number) => formatPriceCents(cents).replace(/\s/g, ' ')
    expect(fmt(0)).toBe('0,00 €')
    expect(fmt(123456)).toBe('1 234,56 €') // 4-digit euros grouped too (useGrouping: 'always')
    expect(fmt(1234567)).toBe('12 345,67 €')
  })
})
