import type { TimerMode } from '../store/timerStore'

interface TimerControlsProps {
  mode: TimerMode
  breakBankMs: number
  onStart: () => void
  onPause: () => void
  onResume: () => void
  onStop: () => void
  onStartBreak: () => void
}

export function TimerControls({
  mode,
  breakBankMs,
  onStart,
  onPause,
  onResume,
  onStop,
  onStartBreak,
}: TimerControlsProps) {
  return (
    <div className="flex flex-col items-center gap-3 my-6">
      {/* Idle state */}
      {mode === 'idle' && (
        <div className="flex gap-3">
          <button
            onClick={onStart}
            className="btn-primary"
            aria-label="Start working timer"
          >
            Start
          </button>
          {breakBankMs > 0 && (
            <button
              onClick={onStartBreak}
              className="btn-primary"
              aria-label="Start break timer"
            >
              Start Break
            </button>
          )}
        </div>
      )}

      {/* Working state */}
      {mode === 'working' && (
        <div className="flex gap-3">
          <button onClick={onPause} className="btn-primary" aria-label="Pause working timer">
            Pause
          </button>
          <button onClick={onStop} className="btn-secondary" aria-label="Stop working timer">
            Stop
          </button>
        </div>
      )}

      {/* Paused work state */}
      {mode === 'paused-work' && (
        <div className="flex gap-3">
          <button onClick={onResume} className="btn-primary" aria-label="Resume working timer">
            Resume
          </button>
          <button onClick={onStop} className="btn-secondary" aria-label="Stop working timer">
            Stop
          </button>
        </div>
      )}

      {/* Break state */}
      {mode === 'break' && (
        <div className="flex gap-3">
          <button onClick={onPause} className="btn-primary" aria-label="Pause break timer">
            Pause
          </button>
          <button onClick={onStop} className="btn-secondary" aria-label="Stop break timer">
            Stop
          </button>
        </div>
      )}

      {/* Paused break state */}
      {mode === 'paused-break' && (
        <div className="flex gap-3">
          <button onClick={onResume} className="btn-primary" aria-label="Resume break timer">
            Resume
          </button>
          <button onClick={onStop} className="btn-secondary" aria-label="Stop break timer">
            Stop
          </button>
        </div>
      )}
    </div>
  )
}
