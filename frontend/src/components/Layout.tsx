import { useResource } from '@/hooks/useResource'
import { fetchInstituicao } from '@/services/api'
import { useAuth } from '@/contexts/AuthContext'
import { useEffect, useRef, useState } from 'react'
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router'
import { LayoutDashboard, LockKeyhole, LogOut, Mail, Menu, Phone, Search, X } from 'lucide-react'
import logoSrc from '@/imports/Logo_Vetorizada_A.L.L_sem_fundo.svg'

export default function Layout() {
  const institution = useResource(fetchInstituicao, { info: null, gestao: null })
  const { isAuthenticated, logout } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [logoutPending, setLogoutPending] = useState(false)
  const [logoutError, setLogoutError] = useState<string | null>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const location = useLocation()
  const navigate = useNavigate()
  const close = () => setMenuOpen(false)
  const institutionInfo = institution.data.info
  const phoneHref = institutionInfo?.telefone?.replace(/[^\d+]/g, '')

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
  }, [location.pathname, location.search])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    navigate(`/busca?q=${encodeURIComponent(query.trim())}`)
    close()
  }

  const handleLogout = async () => {
    if (logoutPending) return
    setLogoutPending(true)
    setLogoutError(null)
    try {
      await logout()
      close()
      navigate('/')
    } catch {
      setLogoutError('Não foi possível encerrar a sessão. Atualize a página e tente sair novamente.')
    } finally { setLogoutPending(false) }
  }

  const navLinks = [
    ['Início', '/'],
    ['Academia', '/academia'],
    ['Cadeiras', '/cadeiras'],
    ['Acervo', '/acervo'],
    ['Agenda', '/agenda'],
    ['Notícias', '/noticias'],
    ['Contato', '/contato'],
  ]

  return (
    <>
      <header className="site-header">
        {/* ── Barra superior ── */}
        <div className="header-top wrap">
          <div className="header-brand">
            <NavLink to="/" className="brand-mark" onClick={close} aria-label="A.L.L. — página inicial">
              <img src={logoSrc} alt="" className="brand-logo" aria-hidden="true" />
            </NavLink>
          </div>

          <div className="header-actions">
            <form className="header-search search-control" role="search" onSubmit={handleSearch} onClick={() => searchInputRef.current?.focus()}>
              <Search size={14} strokeWidth={1.5} />
              <input
                type="search"
                ref={searchInputRef}
                placeholder="Buscar no portal…"
                aria-label="Buscar"
                value={query}
                onChange={e => setQuery(e.target.value)}
              />
              <button type="submit" aria-label="Pesquisar no portal">
                <span>Buscar</span>
              </button>
            </form>
            {isAuthenticated ? (
              <button className="header-login" type="button" onClick={handleLogout} disabled={logoutPending} aria-label="Encerrar sessão administrativa">
                <LogOut size={14} strokeWidth={1.7} />
                <span>{logoutPending ? 'Saindo…' : 'Sair'}</span>
              </button>
            ) : (
              <NavLink
                className={({ isActive }) => `header-login ${isActive ? 'nav-active' : ''}`}
                to="/login"
                aria-label="Entrar na área restrita"
              >
                <LockKeyhole size={14} strokeWidth={1.7} />
                <span>Login</span>
              </NavLink>
            )}
          </div>

          <button
            className="menu-toggle"
            aria-label={menuOpen ? 'Fechar menu' : 'Abrir menu'}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* ── Barra de navegação ── */}
        <nav className={`main-nav-bar ${menuOpen ? 'is-open' : ''}`} aria-label="Navegação principal">
          <form className="mobile-search search-control wrap" role="search" onSubmit={handleSearch}>
            <Search size={14} strokeWidth={1.5} aria-hidden="true" />
            <input type="search" aria-label="Buscar no portal" placeholder="Buscar no portal…" value={query} onChange={e => setQuery(e.target.value)} />
            <button type="submit" aria-label="Pesquisar"><span>Buscar</span></button>
          </form>
          <div className="main-nav-inner wrap">
            {navLinks.map(([label, path]) => (
              <NavLink
                key={path}
                to={path}
                end={path === '/'}
                className={({ isActive }) => isActive ? 'nav-active' : ''}
                onClick={close}
              >
                {label}
              </NavLink>
            ))}
            {isAuthenticated && (
              <NavLink className={({ isActive }) => `admin-nav-link ${isActive ? 'nav-active' : ''}`} to="/admin" onClick={close}>
                <LayoutDashboard size={14} strokeWidth={1.7} />
                Administração
              </NavLink>
            )}
            {isAuthenticated ? (
              <button className="mobile-login mobile-logout" type="button" onClick={handleLogout} disabled={logoutPending}>
                <LogOut size={14} strokeWidth={1.7} />
                {logoutPending ? 'Saindo…' : 'Sair'}
              </button>
            ) : (
              <NavLink className="mobile-login" to="/login" onClick={close}>
                <LockKeyhole size={14} strokeWidth={1.7} />
                Login
              </NavLink>
            )}
          </div>
        </nav>
      </header>

      <div className="page-shell">
        {logoutError && <p className="wrap login-notice" role="alert">{logoutError}</p>}
        <Outlet />
      </div>

      <footer id="contato-rodape" className="site-footer">
        <div className="wrap footer-minimal">
          <div className="footer-minimal-main">
            <NavLink to="/" className="footer-minimal-brand" aria-label="Página inicial da Academia Limoeirense de Letras">
              <span className="footer-seal" aria-hidden="true">
                <svg viewBox="0 0 120 120">
                  <defs>
                    <path id="footer-seal-path" d="M 60,60 m -45,0 a 45,45 0 1,1 90,0 a 45,45 0 1,1 -90,0" />
                  </defs>
                  <circle cx="60" cy="60" r="57" />
                  <text>
                    <textPath href="#footer-seal-path" startOffset="1%" textLength="278" lengthAdjust="spacing">
                      ACADEMIA LIMOEIRENSE DE LETRAS •
                    </textPath>
                  </text>
                </svg>
                <img src={logoSrc} alt="" />
              </span>
            </NavLink>

            <nav className="footer-minimal-nav" aria-label="Navegação no rodapé">
              <NavLink to="/academia">Academia</NavLink>
              <NavLink to="/cadeiras">Cadeiras</NavLink>
              <NavLink to="/acervo">Acervo</NavLink>
              <NavLink to="/agenda">Agenda</NavLink>
              <NavLink to="/noticias">Notícias</NavLink>
              <NavLink to="/contato">Contato</NavLink>
            </nav>
          </div>

          <div className="footer-minimal-meta">
            <span>© {new Date().getFullYear()} Academia Limoeirense de Letras</span>
            <div className="footer-minimal-contact">
              {institutionInfo?.telefone && (
                <a href={`tel:${phoneHref}`}>
                  <Phone size={13} aria-hidden="true" />
                  {institutionInfo.telefone}
                </a>
              )}
              {institutionInfo?.email && (
                <a href={`mailto:${institutionInfo.email}`}>
                  <Mail size={13} aria-hidden="true" />
                  {institutionInfo.email}
                </a>
              )}
            </div>
          </div>
        </div>
      </footer>
    </>
  )
}
