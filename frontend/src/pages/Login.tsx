import { useState } from 'react'
import { NavLink, Navigate, useLocation, useNavigate } from 'react-router'
import { ArrowLeft, LockKeyhole, Mail } from 'lucide-react'
import logoSrc from '@/imports/Logo_Vetorizada_A.L.L_sem_fundo.svg'
import { useAuth } from '@/contexts/AuthContext'

export default function Login() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { isAuthenticated, login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsSubmitting(true)

    const formData = new FormData(event.currentTarget)
    const email = String(formData.get('email') ?? '').trim()
    const remember = formData.get('remember') === 'on'
    const destination = typeof location.state === 'object' && location.state && 'from' in location.state
      ? String(location.state.from)
      : '/admin'

    login(email, remember)
    navigate(destination, { replace: true })
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
            <form className="login-form" onSubmit={handleSubmit}>
            <div className="login-field">
              <label htmlFor="login-email">E-mail institucional</label>
              <div className="login-input-wrap">
                <Mail size={17} strokeWidth={1.5} aria-hidden="true" />
                <input id="login-email" name="email" type="email" autoComplete="username" required placeholder="nome@academia.org.br" />
              </div>
            </div>

            <div className="login-field">
              <label htmlFor="login-password">Senha</label>
              <div className="login-input-wrap">
                <LockKeyhole size={17} strokeWidth={1.5} aria-hidden="true" />
                <input id="login-password" name="password" type="password" autoComplete="current-password" required placeholder="Digite sua senha" />
              </div>
            </div>

            <label className="login-remember">
              <input type="checkbox" name="remember" />
              <span>Lembrar meu acesso neste dispositivo</span>
            </label>

            <button className="login-submit" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Entrando…' : 'Entrar'}
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
