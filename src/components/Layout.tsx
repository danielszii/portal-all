import { useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router'
import { Menu, X, Search } from 'lucide-react'
import logoSrc from '@/imports/Logo_Vetorizada_A.L.L_sem_fundo.svg'

export default function Layout() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [query, setQuery] = useState('')
  const navigate = useNavigate()
  const close = () => setMenuOpen(false)

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) navigate(`/noticias?q=${encodeURIComponent(query.trim())}`)
  }

  const navLinks = [
    ['Início', '/'],
    ['A Academia', '/academia'],
    ['Cadeiras & Membros', '/cadeiras'],
    ['Acervo Digital', '/acervo'],
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
            <NavLink to="/" className="brand-name" onClick={close}>
              <span className="brand-sigla">A.L.L.</span>
              <span className="brand-full">Academia Limoeirense<br />de Letras</span>
            </NavLink>
          </div>

          <div className="header-actions">
            <form className="header-search" role="search" onSubmit={handleSearch}>
              <Search size={14} strokeWidth={1.5} />
              <input
                type="search"
                placeholder="Buscar no portal…"
                aria-label="Buscar"
                value={query}
                onChange={e => setQuery(e.target.value)}
              />
              <button type="submit" style={{ display: 'none' }} />
            </form>
            <div className="header-social">
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" stroke="none"/></svg>
              </a>
              <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" aria-label="YouTube">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.97C18.88 4 12 4 12 4s-6.88 0-8.59.45A2.78 2.78 0 0 0 1.46 6.42 29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58 2.78 2.78 0 0 0 1.95 1.97C5.12 20 12 20 12 20s6.88 0 8.59-.45a2.78 2.78 0 0 0 1.95-1.97A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z"/><polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02" fill="currentColor" stroke="none"/></svg>
              </a>
              <a href="https://wa.me" target="_blank" rel="noopener noreferrer" aria-label="WhatsApp">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
              </a>
              <a href="https://x.com" target="_blank" rel="noopener noreferrer" aria-label="X / Twitter">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.748l7.73-8.835L1.254 2.25H8.08l4.259 5.63 5.905-5.63Z"/></svg>
              </a>
            </div>
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

      <Outlet />

      <footer id="contato-rodape" className="site-footer">
        <div className="wrap footer-grid">
          <div className="footer-brand">
            <span className="monogram">A.L.L.</span>
            <p>Academia Limoeirense<br />de Letras</p>
          </div>
          <div>
            <p className="footer-label">Visite-nos</p>
            <p>Rua Coronel Serafim Chaves, 284<br />Centro · Limoeiro do Norte — CE<br />CEP 62930-000</p>
          </div>
          <div>
            <p className="footer-label">Institucional</p>
            <NavLink to="/academia">Estatuto social</NavLink>
            <NavLink to="/contato">Fale com a Academia</NavLink>
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer">Instagram</a>
          </div>
          <div className="footer-end">
            <p>"A literatura nos faz<br />contemporâneos de todos."</p>
            <small>Portal institucional · 2026</small>
          </div>
        </div>
        <div className="wrap footer-bottom">
          <span>© Academia Limoeirense de Letras</span>
          <span>Projeto editorial e desenvolvimento · A.L.L.</span>
        </div>
      </footer>
    </>
  )
}
