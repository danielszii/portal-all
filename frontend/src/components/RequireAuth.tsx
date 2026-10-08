import { Link, Navigate, Outlet, useLocation } from 'react-router'
import { useAuth } from '@/contexts/AuthContext'
import { canOpenAdminPage } from '@/services/admin-permissions'

export default function RequireAuth() {
  const { isAuthenticated, loading, error, refresh, can } = useAuth()
  const location = useLocation()

  if (loading && !isAuthenticated) return <main className="wrap load-state" role="status">Verificando acesso…</main>
  if (error && !isAuthenticated) return <main className="wrap load-state load-state-error" role="alert">
    <p>{error}</p><button className="filtro-btn" type="button" onClick={() => void refresh()}>Tentar novamente</button>
  </main>
  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  if (!canOpenAdminPage(location.pathname, can)) return <main className="wrap load-state" role="alert">
    <p>Seu perfil não tem acesso a esta área.</p><Link to="/admin">Voltar ao painel</Link>
  </main>
  return <Outlet />
}
