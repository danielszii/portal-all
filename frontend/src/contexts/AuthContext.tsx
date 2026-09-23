import { createContext, useContext, useMemo, useState } from 'react'

type AdminUser = { email: string }

type AuthContextValue = {
  user: AdminUser | null
  isAuthenticated: boolean
  login: (email: string, remember: boolean) => void
  logout: () => void
}

const AUTH_STORAGE_KEY = 'all.admin.session'
const AuthContext = createContext<AuthContextValue | null>(null)

function readStoredUser(): AdminUser | null {
  const storedUser = sessionStorage.getItem(AUTH_STORAGE_KEY) ?? localStorage.getItem(AUTH_STORAGE_KEY)
  if (!storedUser) return null

  try {
    return JSON.parse(storedUser) as AdminUser
  } catch {
    sessionStorage.removeItem(AUTH_STORAGE_KEY)
    localStorage.removeItem(AUTH_STORAGE_KEY)
    return null
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(readStoredUser)

  const value = useMemo<AuthContextValue>(() => ({
    user,
    isAuthenticated: Boolean(user),
    login(email, remember) {
      const nextUser = { email }
      const storage = remember ? localStorage : sessionStorage
      sessionStorage.removeItem(AUTH_STORAGE_KEY)
      localStorage.removeItem(AUTH_STORAGE_KEY)
      storage.setItem(AUTH_STORAGE_KEY, JSON.stringify(nextUser))
      setUser(nextUser)
    },
    logout() {
      sessionStorage.removeItem(AUTH_STORAGE_KEY)
      localStorage.removeItem(AUTH_STORAGE_KEY)
      setUser(null)
    },
  }), [user])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth deve ser usado dentro de AuthProvider')
  return context
}
