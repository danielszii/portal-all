import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { fetchAdminSession, loginAdmin, logoutAdmin, type AdminSession } from '@/services/auth'

type AuthContextValue = {
  user: AdminSession['user'] | null
  isAuthenticated: boolean
  loading: boolean
  error: string | null
  csrfToken: string | null
  refresh: () => Promise<void>
  login: (email: string, password: string, remember: boolean) => Promise<void>
  logout: () => Promise<void>
}

const AUTH_STORAGE_KEY = 'all.admin.session'
const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<AdminSession | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const version = useRef(0)
  const request = useRef<AbortController | null>(null)
  const busy = useRef(false)

  const refresh = useCallback(async () => {
    if (busy.current) return
    const current = ++version.current
    request.current?.abort()
    const controller = new AbortController()
    request.current = controller
    setLoading(true)
    setError(null)
    try {
      const result = await fetchAdminSession(controller.signal)
      if (version.current === current) setSession(result)
    } catch (err) {
      if (version.current === current && !controller.signal.aborted) {
        setSession(null)
        setError(err instanceof Error ? err.message : 'Não foi possível verificar sua sessão.')
      }
    } finally {
      if (version.current === current && !controller.signal.aborted) setLoading(false)
    }
  }, [])

  useEffect(() => {
    // Descarta sessões simuladas antigas. O storage nunca autoriza o acesso.
    for (const storage of ['localStorage', 'sessionStorage'] as const) {
      try { window[storage].removeItem(AUTH_STORAGE_KEY) } catch { /* Storage pode estar bloqueado. */ }
    }
    void refresh()
    const onFocus = () => { void refresh() }
    window.addEventListener('focus', onFocus)
    return () => {
      version.current++
      request.current?.abort()
      window.removeEventListener('focus', onFocus)
    }
  }, [refresh])

  useEffect(() => {
    if (!session) return
    const expires = window.setTimeout(() => { setSession(null) }, Math.max(0, Date.parse(session.expiraEm) - Date.now()))
    const check = window.setInterval(() => { if (document.visibilityState === 'visible') void refresh() }, 60_000)
    return () => { window.clearTimeout(expires); window.clearInterval(check) }
  }, [session, refresh])

  const value = useMemo<AuthContextValue>(() => ({
    user: session?.user ?? null,
    isAuthenticated: session !== null,
    csrfToken: session?.csrfToken ?? null,
    loading, error, refresh,
    async login(email, password, remember) {
      busy.current = true
      version.current++
      request.current?.abort()
      setError(null)
      try { setSession(await loginAdmin(email, password, remember)) }
      finally { busy.current = false; setLoading(false) }
    },
    async logout() {
      busy.current = true
      version.current++
      request.current?.abort()
      try {
        if (session) await logoutAdmin(session.csrfToken)
        setSession(null)
        setError(null)
      } finally { busy.current = false; setLoading(false) }
    },
  }), [session, loading, error, refresh])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth deve ser usado dentro de AuthProvider')
  return context
}
