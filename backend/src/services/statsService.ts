import { sql, and, gte, lt, eq } from 'drizzle-orm'
import { db } from '../db/client.js'
import { workSessions, breakSessions } from '../db/schema.js'
import type { DailyStats } from '@pomo-timer/shared'

function dayBounds(dateStr: string, timezone: string): { start: Date; end: Date } {
  const start = new Date(`${dateStr}T00:00:00`)
  const end = new Date(`${dateStr}T23:59:59.999`)

  if (timezone && timezone !== 'UTC') {
    try {
      const formatter = new Intl.DateTimeFormat('en-CA', {
        timeZone: timezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      })
      const startLocal = new Date(
        formatter.format(new Date(`${dateStr}T00:00:00`)).replace(
          /(\d+)\/(\d+)\/(\d+),\s(\d+):(\d+):(\d+)/,
          '$3-$1-$2T$4:$5:$6',
        ),
      )
      void startLocal
    } catch {
      // fall through to UTC
    }
  }

  return { start, end }
}

export async function getDailyStats(
  date: string,
  userId: string,
  timezone = 'UTC',
): Promise<DailyStats> {
  const { start, end } = dayBounds(date, timezone)

  const workResult = await db
    .select({
      totalWorkMs: sql<number>`coalesce(sum(${workSessions.durationMs}), 0)`,
      count: sql<number>`count(*)`,
    })
    .from(workSessions)
    .where(
      and(
        eq(workSessions.userId, userId),
        gte(workSessions.startedAt, start),
        lt(workSessions.startedAt, end),
      ),
    )

  const breakResult = await db
    .select({
      totalBreakMs: sql<number>`coalesce(sum(${breakSessions.consumedMs}), 0)`,
    })
    .from(breakSessions)
    .where(
      and(
        eq(breakSessions.userId, userId),
        gte(breakSessions.startedAt, start),
        lt(breakSessions.startedAt, end),
      ),
    )

  return {
    date,
    totalWorkMs: Number(workResult[0]?.totalWorkMs ?? 0),
    totalBreakMs: Number(breakResult[0]?.totalBreakMs ?? 0),
    workSessionCount: Number(workResult[0]?.count ?? 0),
  }
}
