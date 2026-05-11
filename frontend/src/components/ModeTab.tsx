import type { TimerMode } from '../store/timerStore'

interface ModeTabProps {
  mode: TimerMode
}

const isWorkMode = (mode: TimerMode) => mode === 'idle' || mode === 'working' || mode === 'paused-work'

export function ModeTab({ mode }: ModeTabProps) {
  const workActive = isWorkMode(mode)

  return (
    <div className="flex justify-center gap-2 mb-4" role="tablist" aria-label="Timer mode">
      <button
        role="tab"
        aria-selected={workActive}
        className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white ${
          workActive ? 'bg-white/25 text-white' : 'text-white/60 hover:text-white hover:bg-white/10'
        }`}
        disabled
      >
        Working
      </button>
      <button
        role="tab"
        aria-selected={!workActive}
        className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white ${
          !workActive ? 'bg-white/25 text-white' : 'text-white/60 hover:text-white hover:bg-white/10'
        }`}
        disabled
      >
        Break
      </button>
    </div>
  )
}
