import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { calculateBreakBank } from '../utils/breakBank'
import * as api from '../services/api'

export type TimerMode = 'idle' | 'working' | 'paused-work' | 'break' | 'paused-break'

interface TimerState {
  mode: TimerMode
  // Work session
  workSessionId: string | null
  workIntervalStartMs: number | null  // Date.now() when current work period started
  accumulatedWorkMs: number           // Work ms from all completed periods this session
  // Break session
  breakSessionId: string | null
  breakBankMs: number
  breakIntervalStartMs: number | null
  consumedBreakMs: number             // Break ms consumed in completed periods
}

interface TimerActions {
  startWork: () => Promise<void>
  pauseWork: () => void
  resumeWork: () => void
  stopWork: () => Promise<void>
  startBreak: () => Promise<void>
  pauseBreak: () => void
  resumeBreak: () => void
  stopBreak: () => Promise<void>
  onBreakComplete: () => Promise<void>
  reset: () => void
}

const initialState: TimerState = {
  mode: 'idle',
  workSessionId: null,
  workIntervalStartMs: null,
  accumulatedWorkMs: 0,
  breakSessionId: null,
  breakBankMs: 0,
  breakIntervalStartMs: null,
  consumedBreakMs: 0,
}

function currentWorkMs(state: TimerState): number {
  if (state.workIntervalStartMs === null) return state.accumulatedWorkMs
  return state.accumulatedWorkMs + (Date.now() - state.workIntervalStartMs)
}

function currentConsumedMs(state: TimerState): number {
  if (state.breakIntervalStartMs === null) return state.consumedBreakMs
  return state.consumedBreakMs + (Date.now() - state.breakIntervalStartMs)
}

export const useTimerStore = create<TimerState & TimerActions>()(
  persist(
    (set, get) => ({
      ...initialState,

      startWork: async () => {
        const state = get()
        // Forfeit any pending break bank
        if (state.breakBankMs > 0 && state.breakSessionId) {
          api
            .updateBreakSession(state.breakSessionId, {
              action: 'stop',
              consumedMs: currentConsumedMs(state),
            })
            .catch(() => {})
        }

        try {
          const session = await api.createWorkSession()
          set({
            mode: 'working',
            workSessionId: session.id,
            workIntervalStartMs: Date.now(),
            accumulatedWorkMs: 0,
            breakBankMs: 0,
            breakSessionId: null,
            consumedBreakMs: 0,
          })
        } catch {
          // Start timer locally even if API is unavailable
          set({
            mode: 'working',
            workSessionId: null,
            workIntervalStartMs: Date.now(),
            accumulatedWorkMs: 0,
            breakBankMs: 0,
            breakSessionId: null,
            consumedBreakMs: 0,
          })
        }
      },

      pauseWork: () => {
        const state = get()
        const newAccumulated = currentWorkMs(state)
        set({ mode: 'paused-work', workIntervalStartMs: null, accumulatedWorkMs: newAccumulated })
        if (state.workSessionId) {
          api
            .updateWorkSession(state.workSessionId, {
              action: 'pause',
              durationMs: newAccumulated,
              pausedDurationMs: 0,
            })
            .catch(() => {})
        }
      },

      resumeWork: () => {
        const state = get()
        set({ mode: 'working', workIntervalStartMs: Date.now() })
        if (state.workSessionId) {
          api
            .updateWorkSession(state.workSessionId, {
              action: 'resume',
              durationMs: state.accumulatedWorkMs,
              pausedDurationMs: 0,
            })
            .catch(() => {})
        }
      },

      stopWork: async () => {
        const state = get()
        const totalWorkMs = currentWorkMs(state)
        const bankMs = calculateBreakBank(totalWorkMs)
        set({
          mode: 'idle',
          workIntervalStartMs: null,
          accumulatedWorkMs: 0,
          breakBankMs: bankMs,
          workSessionId: state.workSessionId, // keep for break session FK
        })
        if (state.workSessionId) {
          api
            .updateWorkSession(state.workSessionId, {
              action: 'stop',
              durationMs: totalWorkMs,
              pausedDurationMs: 0,
            })
            .catch(() => {})
        }
      },

      startBreak: async () => {
        const state = get()
        if (state.breakBankMs <= 0) return
        try {
          const breakSession = await api.createBreakSession({
            workSessionId: state.workSessionId ?? '',
          })
          set({
            mode: 'break',
            breakSessionId: breakSession.id,
            breakIntervalStartMs: Date.now(),
            consumedBreakMs: 0,
          })
        } catch {
          set({
            mode: 'break',
            breakSessionId: null,
            breakIntervalStartMs: Date.now(),
            consumedBreakMs: 0,
          })
        }
      },

      pauseBreak: () => {
        const state = get()
        const newConsumed = currentConsumedMs(state)
        set({ mode: 'paused-break', breakIntervalStartMs: null, consumedBreakMs: newConsumed })
        if (state.breakSessionId) {
          api
            .updateBreakSession(state.breakSessionId, { action: 'pause', consumedMs: newConsumed })
            .catch(() => {})
        }
      },

      resumeBreak: () => {
        const state = get()
        set({ mode: 'break', breakIntervalStartMs: Date.now() })
        if (state.breakSessionId) {
          api
            .updateBreakSession(state.breakSessionId, {
              action: 'resume',
              consumedMs: state.consumedBreakMs,
            })
            .catch(() => {})
        }
      },

      stopBreak: async () => {
        const state = get()
        const consumed = currentConsumedMs(state)
        if (state.breakSessionId) {
          api
            .updateBreakSession(state.breakSessionId, { action: 'stop', consumedMs: consumed })
            .catch(() => {})
        }
        set({
          mode: 'idle',
          breakIntervalStartMs: null,
          consumedBreakMs: 0,
          breakBankMs: 0,
          breakSessionId: null,
          workSessionId: null,
        })
      },

      onBreakComplete: async () => {
        const state = get()
        if (state.breakSessionId) {
          api
            .updateBreakSession(state.breakSessionId, {
              action: 'complete',
              consumedMs: state.breakBankMs,
            })
            .catch(() => {})
        }
        set({
          mode: 'idle',
          breakIntervalStartMs: null,
          consumedBreakMs: 0,
          breakBankMs: 0,
          breakSessionId: null,
          workSessionId: null,
        })
      },

      reset: () => set(initialState),
    }),
    {
      name: 'pomo-timer-state',
    },
  ),
)
