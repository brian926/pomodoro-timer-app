import type { TimerMode } from '../store/timerStore'
import { formatBreakBank } from '../utils/breakBank'

interface BreakBankProps {
  bankMs: number
  mode: TimerMode
}

export function BreakBank({ bankMs, mode }: BreakBankProps) {
  if (mode !== 'idle') return null

  return (
    <div className="text-center mt-2 mb-4" aria-live="polite" aria-atomic="true">
      {bankMs > 0 ? (
        <p className="text-white/90 text-base">
          Break earned:{' '}
          <span className="font-semibold text-white">{formatBreakBank(bankMs)}</span>
        </p>
      ) : (
        <p className="text-white/50 text-sm">No break earned yet</p>
      )}
    </div>
  )
}
