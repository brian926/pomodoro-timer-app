export type WorkStatus = 'running' | 'paused' | 'stopped'
export type BreakStatus = 'running' | 'paused' | 'completed' | 'stopped_early'
export type WorkAction = 'pause' | 'resume' | 'stop'
export type BreakAction = 'pause' | 'resume' | 'stop' | 'complete'

export interface WorkSession {
  id: string
  status: WorkStatus
  startedAt: string
  endedAt: string | null
  durationMs: number
  pausedDurationMs: number
  breakBankMs: number
  createdAt: string
}

export interface BreakSession {
  id: string
  workSessionId: string
  status: BreakStatus
  initialBankMs: number
  consumedMs: number
  startedAt: string
  endedAt: string | null
  createdAt: string
}

export interface DailyStats {
  date: string
  totalWorkMs: number
  totalBreakMs: number
  workSessionCount: number
}

export interface UpdateWorkSessionBody {
  action: WorkAction
  durationMs: number
  pausedDurationMs: number
}

export interface UpdateBreakSessionBody {
  action: BreakAction
  consumedMs: number
}

export interface CreateBreakSessionBody {
  workSessionId: string
}
