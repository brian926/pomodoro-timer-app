import { useState, useEffect, useCallback } from 'react'
import { getDailyStats } from '../services/api'
import type { DailyStats } from '@pomo-timer/shared'
import { formatBreakBank } from '../utils/breakBank'

const LAST_SEEN_KEY = 'pomo-last-seen-date'

function todayStr(): string {
  return new Date().toISOString().slice(0, 10)
}

function formatWorkTime(ms: number): string {
  const totalMinutes = Math.floor(ms / 60000)
  if (totalMinutes < 60) return `${totalMinutes} min`
  const hours = Math.floor(totalMinutes / 60)
  const mins = totalMinutes % 60
  return mins > 0 ? `${hours} hr ${mins} min` : `${hours} hr`
}

interface DailyStatsProps {
  refreshTrigger?: number
}

export function DailyStats({ refreshTrigger }: DailyStatsProps) {
  const [stats, setStats] = useState<DailyStats | null>(null)

  const fetchStats = useCallback(async () => {
    try {
      const today = todayStr()
      // Midnight-reset detection
      const lastSeen = localStorage.getItem(LAST_SEEN_KEY)
      if (lastSeen && lastSeen !== today) {
        setStats({ date: today, totalWorkMs: 0, totalBreakMs: 0, workSessionCount: 0 })
      }
      localStorage.setItem(LAST_SEEN_KEY, today)

      const data = await getDailyStats(today)
      setStats(data)
    } catch {
      // API not available — silently skip
    }
  }, [])

  useEffect(() => {
    fetchStats()
  }, [fetchStats, refreshTrigger])

  if (!stats || (stats.totalWorkMs === 0 && stats.workSessionCount === 0)) {
    return (
      <p className="text-center text-white/40 text-sm mt-6">No sessions today</p>
    )
  }

  return (
    <div className="mt-6 text-center text-white/80 text-sm space-y-1" aria-label="Daily statistics">
      <p>
        Today:{' '}
        <span className="text-white font-medium">{formatWorkTime(stats.totalWorkMs)}</span> worked
        {stats.totalBreakMs > 0 && (
          <>
            {' · '}
            <span className="text-white font-medium">{formatBreakBank(stats.totalBreakMs)}</span>{' '}
            break taken
          </>
        )}
      </p>
      <p className="text-white/40 text-xs">
        {stats.workSessionCount} session{stats.workSessionCount !== 1 ? 's' : ''}
      </p>
    </div>
  )
}
