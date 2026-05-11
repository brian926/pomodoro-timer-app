import { eq } from 'drizzle-orm'
import { db } from '../db/client.js'
import { breakSessions, workSessions, type BreakSessionRow } from '../db/schema.js'
import type { BreakSession } from '@pomo-timer/shared'

function toResponse(row: BreakSessionRow): BreakSession {
  return {
    id: row.id,
    workSessionId: row.workSessionId,
    status: row.status,
    initialBankMs: row.initialBankMs,
    consumedMs: row.consumedMs,
    startedAt: row.startedAt.toISOString(),
    endedAt: row.endedAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
  }
}

export async function createBreakSession(workSessionId: string): Promise<BreakSession> {
  const [workSession] = await db
    .select()
    .from(workSessions)
    .where(eq(workSessions.id, workSessionId))
    .limit(1)

  if (!workSession) {
    throw Object.assign(new Error('Work session not found'), { statusCode: 404 })
  }
  if (workSession.status !== 'stopped') {
    throw Object.assign(new Error('Work session must be stopped before starting a break'), {
      statusCode: 409,
    })
  }
  if (workSession.breakBankMs <= 0) {
    throw Object.assign(new Error('No break time earned for this session'), { statusCode: 409 })
  }

  const [existing] = await db
    .select()
    .from(breakSessions)
    .where(eq(breakSessions.workSessionId, workSessionId))
    .limit(1)
  if (existing) {
    throw Object.assign(new Error('A break session already exists for this work session'), {
      statusCode: 409,
    })
  }

  const [row] = await db
    .insert(breakSessions)
    .values({
      workSessionId,
      initialBankMs: workSession.breakBankMs,
      startedAt: new Date(),
    })
    .returning()

  return toResponse(row)
}

export async function updateBreakSession(
  id: string,
  action: 'pause' | 'resume' | 'stop' | 'complete',
  consumedMs: number,
): Promise<BreakSession> {
  const [existing] = await db
    .select()
    .from(breakSessions)
    .where(eq(breakSessions.id, id))
    .limit(1)
  if (!existing) throw Object.assign(new Error('Break session not found'), { statusCode: 404 })

  if (consumedMs > existing.initialBankMs) {
    throw Object.assign(new Error('consumedMs cannot exceed initialBankMs'), { statusCode: 422 })
  }

  const validTransitions: Record<string, string[]> = {
    pause: ['running'],
    resume: ['paused'],
    stop: ['running', 'paused'],
    complete: ['running'],
  }
  if (!validTransitions[action]?.includes(existing.status)) {
    throw Object.assign(
      new Error(`Cannot ${action} a break session with status ${existing.status}`),
      { statusCode: 409 },
    )
  }

  const updates: Partial<BreakSessionRow> = { consumedMs }
  if (action === 'pause') updates.status = 'paused'
  else if (action === 'resume') updates.status = 'running'
  else if (action === 'stop') {
    updates.status = 'stopped_early'
    updates.endedAt = new Date()
  } else if (action === 'complete') {
    updates.status = 'completed'
    updates.endedAt = new Date()
    updates.consumedMs = existing.initialBankMs
  }

  const [updated] = await db
    .update(breakSessions)
    .set(updates)
    .where(eq(breakSessions.id, id))
    .returning()

  return toResponse(updated)
}
