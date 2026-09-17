import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'

import { useAuth } from '@/hooks/useAuth'

/** Reserve une route aux utilisateurs connectes. */
export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, isBootstrapping } = useAuth()

  // Sans cette attente, un rechargement de page renverrait vers /login avant
  // meme que le jeton stocke ait pu etre verifie.
  if (isBootstrapping) return <BootScreen />
  if (!user) return <Navigate to="/login" replace />
  return <>{children}</>
}

/** Empeche d'afficher connexion ou inscription a quelqu'un de deja connecte. */
export function GuestRoute({ children }: { children: ReactNode }) {
  const { user, isBootstrapping } = useAuth()

  if (isBootstrapping) return <BootScreen />
  if (user) return <Navigate to="/tasks" replace />
  return <>{children}</>
}

function BootScreen() {
  return (
    <div className="grid min-h-screen place-items-center bg-slate-50">
      <span className="h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-teal-800" />
    </div>
  )
}
