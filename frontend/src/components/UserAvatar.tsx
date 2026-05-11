import { useAuthStore } from '../store/authStore'

export function UserAvatar() {
  const { user, logout } = useAuthStore()
  if (!user) return null

  return (
    <div className="flex items-center gap-2">
      {user.pictureUrl ? (
        <img
          src={user.pictureUrl}
          alt={user.displayName}
          className="w-8 h-8 rounded-full object-cover"
          referrerPolicy="no-referrer"
        />
      ) : (
        <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white text-sm font-medium">
          {user.displayName.charAt(0).toUpperCase()}
        </div>
      )}
      <button
        onClick={logout}
        className="text-white/60 text-xs hover:text-white/90 transition-colors"
        aria-label="Sign out"
      >
        Sign out
      </button>
    </div>
  )
}
