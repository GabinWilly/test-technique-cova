import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'

import { api, setAuthToken, setUnauthorizedHandler } from '@/lib/api'
import { clearToken, readToken, writeToken } from '@/lib/tokenStorage'
import type { AuthResponse, User } from '@/types'

import { AuthContext, type AuthContextValue } from './auth-context'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isBootstrapping, setIsBootstrapping] = useState(true)

  const logout = useCallback(() => {
    setAuthToken(null)
    clearToken()
    setUser(null)
  }, [])

  // Un 401 sur une route protegee signifie que le jeton n'est plus accepte :
  // on purge la session, les routes protegees renvoient alors vers /login.
  useEffect(() => {
    setUnauthorizedHandler(logout)
    return () => setUnauthorizedHandler(null)
  }, [logout])

  // Au demarrage, un jeton en localStorage ne prouve rien : il peut avoir
  // expire. On le fait valider par /auth/me avant d'ouvrir l'application.
  useEffect(() => {
    const token = readToken()
    if (!token) {
      setIsBootstrapping(false)
      return
    }

    setAuthToken(token)
    let cancelled = false

    api
      .get<User>('/auth/me')
      .then((profile) => {
        if (!cancelled) setUser(profile)
      })
      .catch(() => {
        if (!cancelled) logout()
      })
      .finally(() => {
        if (!cancelled) setIsBootstrapping(false)
      })

    return () => {
      cancelled = true
    }
  }, [logout])

  const applySession = useCallback((data: AuthResponse) => {
    setAuthToken(data.token)
    writeToken(data.token)
    setUser(data.user)
  }, [])

  const login = useCallback(
    async (email: string, password: string) => {
      const session = await api.post<AuthResponse>('/auth/login', { email, password })
      applySession(session)
    },
    [applySession],
  )

  const register = useCallback(
    async (name: string, email: string, password: string) => {
      const session = await api.post<AuthResponse>('/auth/register', {
        name,
        email,
        password,
      })
      applySession(session)
    },
    [applySession],
  )

  const value = useMemo<AuthContextValue>(
    () => ({ user, isBootstrapping, login, register, logout }),
    [user, isBootstrapping, login, register, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
