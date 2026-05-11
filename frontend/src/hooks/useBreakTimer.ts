import { useState, useEffect, useRef, useCallback } from 'react'
import { useTimerStore } from '../store/timerStore'

const TICK_MS = 100

export function useBreakTimer() {
  const mode = useTimerStore((s) => s.mode)
  const breakBankMs = useTimerStore((s) => s.breakBankMs)
  const breakIntervalStartMs = useTimerStore((s) => s.breakIntervalStartMs)
  const consumedBreakMs = useTimerStore((s) => s.consumedBreakMs)
  const startBreak = useTimerStore((s) => s.startBreak)
  const pauseBreak = useTimerStore((s) => s.pauseBreak)
  const resumeBreak = useTimerStore((s) => s.resumeBreak)
  const stopBreak = useTimerStore((s) => s.stopBreak)
  const onBreakComplete = useTimerStore((s) => s.onBreakComplete)

  const [remainingMs, setRemainingMs] = useState(breakBankMs - consumedBreakMs)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const completedRef = useRef(false)

  const handleComplete = useCallback(() => {
    if (!completedRef.current) {
      completedRef.current = true
      onBreakComplete()
    }
  }, [onBreakComplete])

  useEffect(() => {
    completedRef.current = false
  }, [breakBankMs])

  useEffect(() => {
    if (mode === 'break' && breakIntervalStartMs !== null) {
      intervalRef.current = setInterval(() => {
        const consumed = consumedBreakMs + (Date.now() - breakIntervalStartMs)
        const remaining = Math.max(0, breakBankMs - consumed)
        setRemainingMs(remaining)
        if (remaining === 0) {
          if (intervalRef.current) clearInterval(intervalRef.current)
          handleComplete()
        }
      }, TICK_MS)
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      setRemainingMs(Math.max(0, breakBankMs - consumedBreakMs))
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [mode, breakIntervalStartMs, consumedBreakMs, breakBankMs, handleComplete])

  return { remainingMs, startBreak, pauseBreak, resumeBreak, stopBreak }
}
