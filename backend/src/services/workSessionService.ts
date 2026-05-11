import { eq, and, inArray } from 'drizzle-orm'
import { db } from '../db/client.js'
import { workSessions, type WorkSessionRow } from '../db/schema.js'
import type { WorkSession } from '@pomo-timer/shared'

const SHORT_BLOCK_MS = 25 * 60 * 1000
const CYCLE_MS = 100 * 60 * 1000
const SHORT_EARN_MS = 5 * 60 * 1000
const LONG_EARN_MS = 15 * 60 * 1000
const LONG_BLOCK_START_MS = 3 * SHORT_BLOCK_MS

function calculateBreakBank(workMs: number): number {
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

function toResponse(row: WorkSessionRow): WorkSession {
  return {
    id: row.id,
    status: row.status,
    startedAt: row.startedAt.toISOString(),
    endedAt: row.endedAt?.toISOString() ?? null,
    durationMs: row.durationMs,
    pausedDurationMs: row.pausedDurationMs,
    breakBankMs: row.breakBankMs,
    createdAt: row.createdAt.toISOString(),
  }
}

export async function createSession(): Promise<WorkSession> {
  const existing = await db
    .select()
    .from(workSessions)
    .where(inArray(workSessions.status, ['running', 'paused']))
    .limit(1)

  if (existing.length > 0) {
    throw Object.assign(new Error('A session is already active'), { statusCode: 409 })
  }

  const [row] = await db
    .insert(workSessions)
    .values({ startedAt: new Date() })
    .returning()

  return toResponse(row)
}

export async function getSession(id: string): Promise<WorkSession> {
  const [row] = await db.select().from(workSessions).where(eq(workSessions.id, id)).limit(1)
  if (!row) throw Object.assign(new Error('Session not found'), { statusCode: 404 })
  return toResponse(row)
}

export async function updateSession(
  id: string,
  action: 'pause' | 'resume' | 'stop',
  durationMs: number,
  pausedDurationMs: number,
): Promise<WorkSession> {
  const [existing] = await db.select().from(workSessions).where(eq(workSessions.id, id)).limit(1)
  if (!existing) throw Object.assign(new Error('Session not found'), { statusCode: 404 })

  const validTransitions: Record<string, string[]> = {
    pause: ['running'],
    resume: ['paused'],
    stop: ['running', 'paused'],
  }
  if (!validTransitions[action]?.includes(existing.status)) {
    throw Object.assign(
      new Error(`Cannot ${action} a session with status ${existing.status}`),
      { statusCode: 409 },
    )
  }

  const updates: Partial<WorkSessionRow> = { durationMs, pausedDurationMs }
  if (action === 'pause') updates.status = 'paused'
  else if (action === 'resume') updates.status = 'running'
  else if (action === 'stop') {
    updates.status = 'stopped'
    updates.endedAt = new Date()
    updates.breakBankMs = calculateBreakBank(durationMs)
  }

  const [updated] = await db
    .update(workSessions)
    .set(updates)
    .where(and(eq(workSessions.id, id)))
    .returning()

  return toResponse(updated)
}
