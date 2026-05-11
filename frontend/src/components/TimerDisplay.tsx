import { useEffect, useRef } from 'react'
import { formatTime } from '../utils/breakBank'

interface TimerDisplayProps {
  ms: number
  mode: 'work' | 'break'
  label?: string
}

export function TimerDisplay({ ms, mode, label }: TimerDisplayProps) {
  const prevModeRef = useRef(mode)
  const announcerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (prevModeRef.current !== mode && announcerRef.current) {
      announcerRef.current.textContent =
        mode === 'work' ? 'Switched to work mode' : 'Switched to break mode'
    }
    prevModeRef.current = mode
  }, [mode])

  return (
    <div className="flex flex-col items-center my-6">
      {label && <p className="text-white/70 text-sm uppercase tracking-widest mb-2">{label}</p>}
      <time
        aria-label={`${mode === 'work' ? 'Work' : 'Break'} timer: ${formatTime(ms)}`}
        className="text-white font-mono text-8xl font-bold tracking-tight tabular-nums"
      >
        {formatTime(ms)}
      </time>
      {/* Visually hidden live region for screen readers */}
      <div ref={announcerRef} aria-live="assertive" aria-atomic="true" className="sr-only" />
    </div>
  )
}
