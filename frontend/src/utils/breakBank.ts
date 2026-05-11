const SHORT_BLOCK_MS = 25 * 60 * 1000
const CYCLE_MS = 100 * 60 * 1000
const SHORT_EARN_MS = 5 * 60 * 1000
const LONG_EARN_MS = 15 * 60 * 1000
const LONG_BLOCK_START_MS = 3 * SHORT_BLOCK_MS

/**
 * Calculate break bank from total work milliseconds.
 *
 * Rules (replacement model):
 *   - Each 100-min cycle yields 30 min break: 3 short blocks (5 min each) + 1 long block (15 min).
 *   - Partial blocks earn proportional credit at the applicable rate.
 *
 * Examples: 10 min → 2 min | 25 min → 5 min | 100 min → 30 min | 110 min → 32 min
 */
export function calculateBreakBank(workMs: number): number {
  if (workMs <= 0) return 0

  const completeCycles = Math.floor(workMs / CYCLE_MS)
  const remainder = workMs % CYCLE_MS

  // 30 min per complete 100-min cycle
  let bankMs = completeCycles * (3 * SHORT_EARN_MS + LONG_EARN_MS)

  if (remainder <= LONG_BLOCK_START_MS) {
    // Still in short-block territory
    const fraction = remainder / SHORT_BLOCK_MS
    const wholeBlocks = Math.floor(fraction)
    const partial = fraction - wholeBlocks
    bankMs += wholeBlocks * SHORT_EARN_MS + partial * SHORT_EARN_MS
  } else {
    // All 3 short blocks completed, now in long block
    bankMs += 3 * SHORT_EARN_MS
    const longElapsed = remainder - LONG_BLOCK_START_MS
    const longFraction = Math.min(1, longElapsed / SHORT_BLOCK_MS)
    bankMs += longFraction * LONG_EARN_MS
  }

  return Math.round(bankMs)
}

/** Format milliseconds to HH:MM:SS */
export function formatTime(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000))
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  const parts = [minutes.toString().padStart(2, '0'), seconds.toString().padStart(2, '0')]
  if (hours > 0) parts.unshift(hours.toString().padStart(2, '0'))
  return parts.join(':')
}

/** Format milliseconds to a human string like "5 min" or "1 hr 30 min" */
export function formatBreakBank(ms: number): string {
  const totalMinutes = Math.floor(ms / 60000)
  if (totalMinutes < 60) return `${totalMinutes} min`
  const hours = Math.floor(totalMinutes / 60)
  const mins = totalMinutes % 60
  return mins > 0 ? `${hours} hr ${mins} min` : `${hours} hr`
}
