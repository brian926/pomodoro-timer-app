import { useState, useEffect, useRef } from 'react'
import { useTimerStore } from '../store/timerStore'

const TICK_MS = 100

export function useWorkTimer() {
  const mode = useTimerStore((s) => s.mode)
  const workIntervalStartMs = useTimerStore((s) => s.workIntervalStartMs)
  const accumulatedWorkMs = useTimerStore((s) => s.accumulatedWorkMs)
  const startWork = useTimerStore((s) => s.startWork)
  const pauseWork = useTimerStore((s) => s.pauseWork)
  const resumeWork = useTimerStore((s) => s.resumeWork)
  const stopWork = useTimerStore((s) => s.stopWork)

  const [elapsedMs, setElapsedMs] = useState(accumulatedWorkMs)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (mode === 'working' && workIntervalStartMs !== null) {
      intervalRef.current = setInterval(() => {
        setElapsedMs(accumulatedWorkMs + (Date.now() - workIntervalStartMs))
      }, TICK_MS)
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      setElapsedMs(accumulatedWorkMs)
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [mode, workIntervalStartMs, accumulatedWorkMs])

  return { elapsedMs, startWork, pauseWork, resumeWork, stopWork }
}
