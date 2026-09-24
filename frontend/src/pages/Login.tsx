import { useState } from 'react'
import { NavLink, Navigate, useLocation, useNavigate } from 'react-router'
import { ArrowLeft, LockKeyhole, Mail } from 'lucide-react'
import logoSrc from '@/imports/Logo_Vetorizada_A.L.L_sem_fundo.svg'
import { useAuth } from '@/contexts/AuthContext'
import { adminDestination } from '@/services/auth'

export default function Login() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { isAuthenticated, loading, login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (isSubmitting || loading) return
    setIsSubmitting(true)
    setError(null)

    const formData = new FormData(event.currentTarget)
    const email = String(formData.get('email') ?? '').trim()
    const password = String(formData.get('password') ?? '')
    const remember = formData.get('remember') === 'on'
    const destination = typeof location.state === 'object' && location.state && 'from' in location.state
      ? adminDestination(location.state.from)
      : '/admin'

    try {
      await login(email, password, remember)
      navigate(destination, { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível entrar. Tente novamente.')
    } finally { setIsSubmitting(false) }
  }

  if (isAuthenticated) return <Navigate to="/admin" replace />

  return (
    <main className="login-page">
      <section className="wrap login-shell" aria-labelledby="login-title">
        <header className="login-page-heading">
          <h1 id="login-title">Acesso <em>administrativo</em></h1>
        </header>

        <div className="login-card-stack">
          <div className="login-panel">
            <img className="login-card-logo" src={logoSrc} alt="Academia Limoeirense de Letras" />
            <form className="login-form" onSubmit={handleSubmit} aria-busy={isSubmitting || loading}>
            <div className="login-field">
              <label htmlFor="login-email">E-mail institucional</label>
              <div className="login-input-wrap">
                <Mail size={17} strokeWidth={1.5} aria-hidden="true" />
                <input id="login-email" name="email" type="email" autoComplete="username" maxLength={254} disabled={isSubmitting} required placeholder="nome@academia.org.br" />
              </div>
            </div>

            <div className="login-field">
              <label htmlFor="login-password">Senha</label>
              <div className="login-input-wrap">
                <LockKeyhole size={17} strokeWidth={1.5} aria-hidden="true" />
                <input id="login-password" name="password" type="password" autoComplete="current-password" maxLength={128} disabled={isSubmitting} required placeholder="Digite sua senha" />
              </div>
            </div>

            <label className="login-remember">
              <input type="checkbox" name="remember" />
              <span>Lembrar meu acesso neste dispositivo</span>
            </label>

            {error && <p className="login-notice" role="alert">{error}</p>}
            <button className="login-submit" type="submit" disabled={isSubmitting || loading}>
              {isSubmitting ? 'Entrando…' : loading ? 'Verificando acesso…' : 'Entrar'}
              <LockKeyhole size={15} strokeWidth={1.7} />
            </button>
            </form>
          </div>

          <NavLink className="login-return" to="/">
            <ArrowLeft size={14} strokeWidth={1.7} />
            Voltar para o portal
          </NavLink>
        </div>
      </section>
    </main>
  )
}
