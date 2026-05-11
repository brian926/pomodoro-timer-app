const API = import.meta.env.VITE_API_BASE_URL?.replace('/api', '') ?? 'http://localhost:3001'

const errorMessages: Record<string, string> = {
  login_failed: 'Sign-in failed. Please try again.',
  access_denied: 'Sign-in was cancelled.',
}

export function LoginPage() {
  const params = new URLSearchParams(window.location.search)
  const errorKey = params.get('error')
  const errorMsg = errorKey ? (errorMessages[errorKey] ?? 'An error occurred. Please try again.') : null

  return (
    <div className="min-h-screen bg-[var(--color-work-bg)] flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <h1 className="text-white text-3xl font-bold tracking-wide mb-2">Pomo Timer</h1>
          <p className="text-white/60 text-sm">Sign in to track your focus sessions</p>
        </div>

        {errorMsg && (
          <div className="bg-red-500/20 border border-red-400/40 text-red-200 rounded-xl px-4 py-3 text-sm text-center">
            {errorMsg}
          </div>
        )}

        <a
          href={`${API}/api/auth/google`}
          className="flex items-center justify-center gap-3 w-full bg-white text-gray-700 font-medium rounded-xl py-3 px-4 hover:bg-gray-50 transition-colors shadow-md"
        >
          <GoogleIcon />
          Sign in with Google
        </a>
      </div>
    </div>
  )
}

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
    </svg>
  )
}
