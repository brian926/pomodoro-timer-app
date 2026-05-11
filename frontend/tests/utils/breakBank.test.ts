import { describe, it, expect } from 'vitest'
import { calculateBreakBank } from '../../src/utils/breakBank'

const MIN = 60_000

describe('calculateBreakBank', () => {
  it('returns 0 for 0 minutes of work', () => {
    expect(calculateBreakBank(0)).toBe(0)
  })

  it('returns 0 for negative input', () => {
    expect(calculateBreakBank(-1000)).toBe(0)
  })

  it('awards proportional credit for 10 minutes (2 min break)', () => {
    // 10/25 * 5 = 2 min
    expect(calculateBreakBank(10 * MIN)).toBe(2 * MIN)
  })

  it('awards 5 minutes for exactly 25 minutes of work', () => {
    expect(calculateBreakBank(25 * MIN)).toBe(5 * MIN)
  })

  it('awards 10 minutes for exactly 50 minutes of work', () => {
    expect(calculateBreakBank(50 * MIN)).toBe(10 * MIN)
  })

  it('awards 15 minutes for exactly 75 minutes of work', () => {
    expect(calculateBreakBank(75 * MIN)).toBe(15 * MIN)
  })

  it('awards 30 minutes for exactly 100 minutes (replacement rule: 3×5 + 15)', () => {
    expect(calculateBreakBank(100 * MIN)).toBe(30 * MIN)
  })

  it('awards proportional credit for 80 minutes (3×5 + partial long block)', () => {
    // 3 short blocks = 15 min, then 5/25 of long block = 3 min → 18 min
    expect(calculateBreakBank(80 * MIN)).toBe(18 * MIN)
  })

  it('awards 32 minutes for 110 minutes (100 complete + 10 min partial)', () => {
    // 30 min from complete cycle + 10/25 * 5 = 2 min = 32 min
    expect(calculateBreakBank(110 * MIN)).toBe(32 * MIN)
  })

  it('awards 60 minutes for 200 minutes (2 complete cycles)', () => {
    expect(calculateBreakBank(200 * MIN)).toBe(60 * MIN)
  })
})
