import type {
  WorkSession,
  BreakSession,
  DailyStats,
  UpdateWorkSessionBody,
  UpdateBreakSessionBody,
  CreateBreakSessionBody,
} from '@pomo-timer/shared'

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3001/api'

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...init?.headers },
    ...init,
  })
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`API ${res.status}: ${body}`)
  }
  return res.json() as Promise<T>
}

export const createWorkSession = (): Promise<WorkSession> =>
  request<WorkSession>('/sessions/work', { method: 'POST' })

export const updateWorkSession = (id: string, body: UpdateWorkSessionBody): Promise<WorkSession> =>
  request<WorkSession>(`/sessions/work/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  })

export const createBreakSession = (body: CreateBreakSessionBody): Promise<BreakSession> =>
  request<BreakSession>('/sessions/break', { method: 'POST', body: JSON.stringify(body) })

export const updateBreakSession = (
  id: string,
  body: UpdateBreakSessionBody,
): Promise<BreakSession> =>
  request<BreakSession>(`/sessions/break/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  })

export const getDailyStats = (date: string, timezone?: string): Promise<DailyStats> => {
  const params = new URLSearchParams({ date })
  if (timezone) params.set('timezone', timezone)
  return request<DailyStats>(`/stats/daily?${params}`)
}
