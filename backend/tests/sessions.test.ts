import { describe, it, expect, beforeEach, vi } from 'vitest'

// Unit tests for break bank calculation (backend duplicate)
// Integration tests against real DB require the Docker container.

const MIN = 60_000

function calculateBreakBank(workMs: number): number {
  const SHORT_BLOCK_MS = 25 * MIN
  const CYCLE_MS = 100 * MIN
  const SHORT_EARN_MS = 5 * MIN
  const LONG_EARN_MS = 15 * MIN
  const LONG_BLOCK_START_MS = 3 * SHORT_BLOCK_MS

  if (workMs <= 0) return 0
  const completeCycles = Math.floor(workMs / CYCLE_MS)
  const remainder = workMs % CYCLE_MS
  let bankMs = completeCycles * (3 * SHORT_EARN_MS + LONG_EARN_MS)
  if (remainder <= LONG_BLOCK_START_MS) {
    const fraction = remainder / SHORT_BLOCK_MS
    const whole = Math.floor(fraction)
    bankMs += whole * SHORT_EARN_MS + (fraction - whole) * SHORT_EARN_MS
  } else {
    bankMs += 3 * SHORT_EARN_MS
    const longFraction = Math.min(1, (remainder - LONG_BLOCK_START_MS) / SHORT_BLOCK_MS)
    bankMs += longFraction * LONG_EARN_MS
  }
  return Math.round(bankMs)
}

describe('calculateBreakBank (backend)', () => {
  it('returns 0 for 0 ms', () => expect(calculateBreakBank(0)).toBe(0))
  it('10 min → 2 min', () => expect(calculateBreakBank(10 * MIN)).toBe(2 * MIN))
  it('25 min → 5 min', () => expect(calculateBreakBank(25 * MIN)).toBe(5 * MIN))
  it('75 min → 15 min', () => expect(calculateBreakBank(75 * MIN)).toBe(15 * MIN))
  it('100 min → 30 min (replacement)', () => expect(calculateBreakBank(100 * MIN)).toBe(30 * MIN))
  it('200 min → 60 min', () => expect(calculateBreakBank(200 * MIN)).toBe(60 * MIN))
})

describe('session state transitions', () => {
  const validTransitions: Record<string, string[]> = {
    pause: ['running'],
    resume: ['paused'],
    stop: ['running', 'paused'],
  }

  it('allows pausing a running session', () => {
    expect(validTransitions['pause'].includes('running')).toBe(true)
  })

  it('disallows pausing a paused session', () => {
    expect(validTransitions['pause'].includes('paused')).toBe(false)
  })

  it('allows stopping from running or paused', () => {
    expect(validTransitions['stop'].includes('running')).toBe(true)
    expect(validTransitions['stop'].includes('paused')).toBe(true)
  })

  it('disallows resuming a running session', () => {
    expect(validTransitions['resume'].includes('running')).toBe(false)
  })
})
