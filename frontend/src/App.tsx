import { useEffect, useRef, useCallback, useState } from 'react'
import { ModeTab } from './components/ModeTab'
import { TimerDisplay } from './components/TimerDisplay'
import { TimerControls } from './components/TimerControls'
import { BreakBank } from './components/BreakBank'
import { DailyStats } from './components/DailyStats'
import { UserAvatar } from './components/UserAvatar'
import { LoginPage } from './pages/LoginPage'
import { useWorkTimer } from './hooks/useWorkTimer'
import { useBreakTimer } from './hooks/useBreakTimer'
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts'
import { useTimerStore } from './store/timerStore'
import { useAuthStore } from './store/authStore'
import { playChime } from './utils/audio'

export default function App() {
  const { user, isLoading, checkAuth } = useAuthStore()

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--color-work-bg)] flex items-center justify-center">
        <div className="text-white/50 text-sm">Loading…</div>
      </div>
    )
  }

  if (!user) return <LoginPage />

  return <TimerApp />
}

function TimerApp() {
  const mode = useTimerStore((s) => s.mode)
  const breakBankMs = useTimerStore((s) => s.breakBankMs)

  const { elapsedMs, startWork, pauseWork, resumeWork, stopWork } = useWorkTimer()
  const { remainingMs, startBreak, pauseBreak, resumeBreak, stopBreak } = useBreakTimer()

  const [statsRefreshCount, setStatsRefreshCount] = useState(0)
  const prevModeRef = useRef(mode)

  // Fire chime and refresh stats when break completes
  useEffect(() => {
    const wasBreaking = prevModeRef.current === 'break' || prevModeRef.current === 'paused-break'
    if (wasBreaking && mode === 'idle') {
      playChime()
      setStatsRefreshCount((c) => c + 1)
    }
    // Also refresh after work session stops
    const wasWorking = prevModeRef.current === 'working' || prevModeRef.current === 'paused-work'
    if (wasWorking && mode === 'idle') {
      setStatsRefreshCount((c) => c + 1)
    }
    prevModeRef.current = mode
  }, [mode])

const isBreaking = mode === 'break' || mode === 'paused-break'
  const displayMs = isBreaking ? remainingMs : elapsedMs
  const timerMode = isBreaking ? 'break' : 'work'
  const timerLabel = isBreaking ? 'Break' : mode === 'idle' ? 'Ready' : 'Working'

  // Unified pause/resume/stop for keyboard shortcuts
  const handlePause = useCallback(() => {
    if (mode === 'working') pauseWork()
    else if (mode === 'break') pauseBreak()
  }, [mode, pauseWork, pauseBreak])

  const handleResume = useCallback(() => {
    if (mode === 'paused-work') resumeWork()
    else if (mode === 'paused-break') resumeBreak()
  }, [mode, resumeWork, resumeBreak])

  const handleStop = useCallback(() => {
    if (mode === 'working' || mode === 'paused-work') stopWork()
    else if (mode === 'break' || mode === 'paused-break') stopBreak()
  }, [mode, stopWork, stopBreak])

  useKeyboardShortcuts({
    mode,
    onStart: startWork,
    onPause: handlePause,
    onResume: handleResume,
    onStop: handleStop,
  })

  const bgClass = isBreaking
    ? 'bg-[var(--color-break-bg)]'
    : 'bg-[var(--color-work-bg)]'

  return (
    <div
      className={`min-h-screen ${bgClass} transition-colors duration-500 flex flex-col items-center pt-12 px-4`}
    >
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-white text-2xl font-bold tracking-wide opacity-90">
            Pomo Timer
          </h1>
          <UserAvatar />
        </div>

        {/* Timer card */}
        <div className="bg-[var(--color-surface)] rounded-2xl p-8 shadow-xl backdrop-blur-sm">
          <ModeTab mode={mode} />

          <TimerDisplay ms={displayMs} mode={timerMode} label={timerLabel} />

          <TimerControls
            mode={mode}
            breakBankMs={breakBankMs}
            onStart={startWork}
            onPause={handlePause}
            onResume={handleResume}
            onStop={handleStop}
            onStartBreak={startBreak}
          />

          <BreakBank bankMs={breakBankMs} mode={mode} />
        </div>

        {/* Keyboard hint */}
        <p className="text-white/30 text-xs text-center mt-4">
          Space — start/pause/resume · Esc — stop
        </p>

        {/* Daily stats */}
        <DailyStats refreshTrigger={statsRefreshCount} />
      </div>
    </div>
  )
}
