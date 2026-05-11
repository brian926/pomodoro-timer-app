import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { calculateBreakBank } from '../../src/utils/breakBank'

// Unit tests for the break bank logic used by the work timer hook.
// Hook integration tests require a full React render environment.

const MIN = 60_000

describe('work timer break bank logic', () => {
  let nowSpy: ReturnType<typeof vi.spyOn>
  let fakeNow = 0

  beforeEach(() => {
    fakeNow = 0
    nowSpy = vi.spyOn(Date, 'now').mockImplementation(() => fakeNow)
  })

  afterEach(() => {
    nowSpy.mockRestore()
  })

  it('calculates correct break bank for a 25-minute session', () => {
    const workMs = 25 * MIN
    expect(calculateBreakBank(workMs)).toBe(5 * MIN)
  })

  it('calculates correct break bank for a 100-minute session', () => {
    const workMs = 100 * MIN
    expect(calculateBreakBank(workMs)).toBe(30 * MIN)
  })

  it('wall-clock delta matches when no pauses occur', () => {
    const startMs = 1000
    fakeNow = startMs
    const intervalStart = Date.now()

    fakeNow = startMs + 25 * MIN
    const elapsed = Date.now() - intervalStart

    expect(elapsed).toBe(25 * MIN)
    expect(calculateBreakBank(elapsed)).toBe(5 * MIN)
  })

  it('accumulated work ms adds correctly across pauses', () => {
    // Simulate: 15 min work → pause → 10 min work = 25 min total
    const period1 = 15 * MIN
    const period2 = 10 * MIN
    const total = period1 + period2
    expect(calculateBreakBank(total)).toBe(5 * MIN)
  })
})
