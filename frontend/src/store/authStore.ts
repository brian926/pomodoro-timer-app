import { create } from 'zustand'
import type { AuthUser } from '@pomo-timer/shared'

const API = import.meta.env.VITE_API_BASE_URL?.replace('/api', '') ?? 'http://localhost:3001'

interface AuthStore {
  user: AuthUser | null
  isLoading: boolean
  checkAuth: () => Promise<void>
  logout: () => Promise<void>
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  isLoading: true,

  checkAuth: async () => {
    try {
      const res = await fetch(`${API}/api/auth/me`, { credentials: 'include' })
      if (res.ok) {
        set({ user: await res.json() as AuthUser, isLoading: false })
      } else {
        set({ user: null, isLoading: false })
      }
    } catch {
      set({ user: null, isLoading: false })
    }
  },

  logout: async () => {
    try {
      await fetch(`${API}/api/auth/logout`, { method: 'POST', credentials: 'include' })
    } catch {
      // session is cleared on next request regardless
    }
    set({ user: null })
  },
}))
