import { useResource } from '@/hooks/useResource'
import { fetchInstituicao } from '@/services/api'
import { useEffect, useRef, useState } from 'react'
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router'
import { Mail, MapPin, Menu, Phone, Search, X } from 'lucide-react'
import logoSrc from '@/imports/Logo_Vetorizada_A.L.L_sem_fundo.svg'
import footerLogoSrc from '@/imports/Logo Versão Negativa Branca (Alta Qualidade).png'

export default function Layout() {
  const institution = useResource(fetchInstituicao, { info: null, gestao: null })
  const [menuOpen, setMenuOpen] = useState(false)
  const [query, setQuery] = useState('')
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
            <form className="header-search" role="search" onSubmit={handleSearch} onClick={() => searchInputRef.current?.focus()}>
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
          <form className="mobile-search wrap" role="search" onSubmit={handleSearch}>
            <input type="search" aria-label="Buscar no portal" placeholder="Buscar no portal…" value={query} onChange={e => setQuery(e.target.value)} />
            <button type="submit" aria-label="Pesquisar"><Search size={18} /></button>
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
          </div>
        </nav>
      </header>

      <div className="page-shell">
        <Outlet />
      </div>

      <footer id="contato-rodape" className="site-footer">
        <div className="wrap footer-main">
          <div className="footer-brand">
            <img src={footerLogoSrc} alt="Academia Limoeirense de Letras" className="footer-logo" />
            <p className="footer-about">
              Preservando a memória, promovendo a literatura e fortalecendo a cultura
              de Limoeiro do Norte e do Vale do Jaguaribe.
            </p>
            <div className="footer-social" aria-label="Atalhos de contato">
              {institutionInfo?.email && (
                <a href={`mailto:${institutionInfo.email}`} aria-label="Enviar e-mail">
                  <Mail size={17} strokeWidth={1.8} />
                </a>
              )}
            </div>
          </div>

          <nav className="footer-column" aria-label="Navegação no rodapé">
            <p className="footer-label">Explore</p>
            <NavLink to="/">Início</NavLink>
            <NavLink to="/cadeiras">Cadeiras</NavLink>
            <NavLink to="/acervo">Acervo</NavLink>
            <NavLink to="/agenda">Agenda</NavLink>
            <NavLink to="/noticias">Notícias</NavLink>
          </nav>

          <nav className="footer-column" aria-label="Links institucionais">
            <p className="footer-label">Academia</p>
            <NavLink to="/academia">Nossa história</NavLink>
            <NavLink to="/academia">Diretoria</NavLink>
            <NavLink to="/acervo?q=estatuto">Estatuto social</NavLink>
            <NavLink to="/contato">Fale conosco</NavLink>
          </nav>

          <div className="footer-column footer-contact">
            <p className="footer-label">Contato</p>
            {institutionInfo?.telefone && (
              <a href={`tel:${phoneHref}`}>
                <Phone size={16} aria-hidden="true" />
                <span>{institutionInfo.telefone}</span>
              </a>
            )}
            {institutionInfo?.email && (
              <a href={`mailto:${institutionInfo.email}`}>
                <Mail size={16} aria-hidden="true" />
                <span>{institutionInfo.email}</span>
              </a>
            )}
            <NavLink to="/contato">
              <MapPin size={16} aria-hidden="true" />
              <span>{institutionInfo?.endereco ?? 'Consulte nosso endereço'}</span>
            </NavLink>
          </div>
        </div>

        <div className="footer-lower">
          <div className="wrap footer-bottom">
            <span>© {new Date().getFullYear()} Academia Limoeirense de Letras</span>
            <div className="footer-legal">
              <NavLink to="/academia">Institucional</NavLink>
              <NavLink to="/contato">Contato</NavLink>
              <span>Portal oficial da A.L.L.</span>
            </div>
          </div>
        </div>
      </footer>
    </>
  )
}
