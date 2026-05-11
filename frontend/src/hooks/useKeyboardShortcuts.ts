import { useEffect } from 'react'
import type { TimerMode } from '../store/timerStore'

interface KeyboardShortcutsOptions {
  mode: TimerMode
  onStart: () => void
  onPause: () => void
  onResume: () => void
  onStop: () => void
}

export function useKeyboardShortcuts({
  mode,
  onStart,
  onPause,
  onResume,
  onStop,
}: KeyboardShortcutsOptions) {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Do not fire when focus is inside an interactive element
      const tag = (e.target as HTMLElement).tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return

      if (e.code === 'Space') {
        e.preventDefault()
        if (mode === 'idle') onStart()
        else if (mode === 'working' || mode === 'break') onPause()
        else if (mode === 'paused-work' || mode === 'paused-break') onResume()
      }

      if (e.code === 'Escape') {
        if (mode === 'working' || mode === 'paused-work' || mode === 'break' || mode === 'paused-break') {
          onStop()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [mode, onStart, onPause, onResume, onStop])
}
