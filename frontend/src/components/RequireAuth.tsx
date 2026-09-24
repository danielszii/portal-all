import { Navigate, Outlet, useLocation } from 'react-router'
import { useAuth } from '@/contexts/AuthContext'

export default function RequireAuth() {
  const { isAuthenticated, loading, error, refresh } = useAuth()
  const location = useLocation()

  if (loading && !isAuthenticated) return <main className="wrap load-state" role="status">Verificando acesso…</main>
  if (error) return <main className="wrap load-state load-state-error" role="alert">
    <p>{error}</p><button className="filtro-btn" type="button" onClick={() => void refresh()}>Tentar novamente</button>
  </main>
  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  return <Outlet />
}
