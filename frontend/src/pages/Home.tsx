import { useResource } from '@/hooks/useResource'
import LoadState from '@/components/LoadState'
import { useEffect, useState } from 'react'
import { fetchInicioCadeiras, fetchInicioAcervo, fetchInicioEventos, fetchInicioNoticias, fetchInstituicao } from '@/services/api'
import { ArrowUpRight, Clock3, MapPin } from 'lucide-react'
import { NavLink } from 'react-router'
import heroImg from '@/imports/academialetters.jpg'
import MemberPhotoFrame from '@/components/MemberPhotoFrame'
import { formatData, formatDia, formatMes, formatNumeroCadeira } from '@/utils/formatters'

const heroSlides = [
  {
    title: 'As letras permanecem',
    emphasis: 'para sempre.',
    description: 'A Academia Limoeirense de Letras cultivando a memória, a cultura e as palavras de Limoeiro do Norte.',
  },
  {
    title: 'A memória encontra',
    emphasis: 'novas vozes.',
    description: 'Um espaço de encontro entre gerações, onde autores, leitores e pesquisadores mantêm viva a literatura regional.',
  },
  {
    title: 'Limoeiro escreve',
    emphasis: 'sua história.',
    description: 'Obras, registros e trajetórias que preservam a identidade cultural do Vale do Jaguaribe para o futuro.',
  },
]

export default function Home() {
  const [currentHero, setCurrentHero] = useState(0)
  const [heroPaused, setHeroPaused] = useState(false)
  useEffect(() => {
    if (heroPaused || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const timer = window.setInterval(() => setCurrentHero(current => (current + 1) % heroSlides.length), 6500)
    return () => window.clearInterval(timer)
  }, [heroPaused])

  const cadeiras = useResource(fetchInicioCadeiras, { total: 0, items: [] })
  const acervo = useResource(fetchInicioAcervo, { total: 0, items: [] })
  const noticias = useResource(fetchInicioNoticias, [])
  const eventos = useResource(fetchInicioEventos, [])
  const instituicao = useResource(fetchInstituicao, { info: null, gestao: null })
  const chairs = cadeiras.error ? [] : cadeiras.data.items
  const publications = acervo.error ? [] : acervo.data.items
  const nextEvent = eventos.error ? null : eventos.data[0]

  return (
    <main className="home-page">
      {/* Hero */}
      <section
        id="inicio"
        className="hero"
        aria-roledescription="carrossel"
        aria-label="Destaques da Academia"
        onMouseEnter={() => setHeroPaused(true)}
        onMouseLeave={() => setHeroPaused(false)}
        onFocusCapture={() => setHeroPaused(true)}
        onBlurCapture={event => { if (!event.currentTarget.contains(event.relatedTarget)) setHeroPaused(false) }}
      >
        <div className="hero-bg">
          <img src={heroImg} alt="Fachada da Academia Limoeirense de Letras, Limoeiro do Norte — CE" width="1920" height="1080" fetchPriority="high" />
          <div className="hero-overlay" />
        </div>
        <div className="hero-copy">
          <div className="hero-message" key={currentHero} aria-live={heroPaused ? 'polite' : 'off'} aria-atomic="true">
            <h1>{heroSlides[currentHero].title}<br /><em>{heroSlides[currentHero].emphasis}</em></h1>
            <p className="hero-intro">{heroSlides[currentHero].description}</p>
          </div>
        </div>
        <div className="hero-index" role="group" aria-label="Selecionar mensagem em destaque">
          {heroSlides.map((slide, index) => (
            <button
              type="button"
              key={slide.title}
              className={currentHero === index ? 'is-active' : ''}
              aria-label={`Exibir destaque ${index + 1}: ${slide.title}`}
              aria-current={currentHero === index ? 'true' : undefined}
              onClick={() => setCurrentHero(index)}
            >
              {String(index + 1).padStart(2, '0')}
              {currentHero === index && <span />}
            </button>
          ))}
        </div>
      </section>

      {/* A Instituição */}
      <section className="intro-section intro-z">
        <div className="wrap intro-z-wrap">
          <div className="intro-z-main">
            <div className="intro-z-title">
              <h2>Literatura que<br /><em>atravessa o tempo.</em></h2>
            </div>
            <div className="intro-z-story">
              <p className="lead">Preservamos a memória literária de Limoeiro do Norte e criamos espaço para as próximas vozes.</p>
            </div>
          </div>

          <footer className="intro-z-bottom">
            <div className="intro-z-facts" aria-label="Números da Academia">
              <div><strong>{!instituicao.error && instituicao.data.info?.fundacaoAno ? new Date().getFullYear() - instituicao.data.info.fundacaoAno : '—'}</strong><span>anos</span></div>
              <div><strong>{cadeiras.loading || cadeiras.error ? '—' : cadeiras.data.total}</strong><span>cadeiras</span></div>
              <div><strong>{acervo.loading || acervo.error ? '—' : acervo.data.total}</strong><span>obras</span></div>
            </div>
            <NavLink className="intro-z-cta" to="/academia">
              <span>Conheça nossa história</span>
              <ArrowUpRight size={18} />
            </NavLink>
          </footer>
          <LoadState {...instituicao} />
        </div>
      </section>

      {/* Cadeiras */}
      <section className="chairs-section">
        <div className="wrap">
          <div className="section-heading">
            <div>
              <h2>Quadro de <em>cadeiras</em></h2>
            </div>
            <NavLink className="action-pill home-section-action" to="/cadeiras">Ver quadro completo <ArrowUpRight size={15} aria-hidden="true" /></NavLink>
          </div>
          <div className="chair-grid">
            <LoadState {...cadeiras} />
            {chairs.map((chair) => (
              <NavLink to={`/cadeiras/${chair.number.toLowerCase()}`} key={chair.number} className="chair" aria-label={`Cadeira ${formatNumeroCadeira(chair.number)} — ${chair.patron}`}>
                <MemberPhotoFrame
                  src={chair.image}
                  alt={`Retrato de ${chair.holder}`}
                  status={chair.status}
                  chairNumber={chair.number}
                  size="md"
                  photoVariant="institutional-demo"
                />
                <div className="chair-meta">
                  <span className="chair-number">Cadeira · {formatNumeroCadeira(chair.number)}</span>
                  <h3>{chair.holder}</h3>
                  <p className="chair-patron">{chair.patron}</p>
                  <span className={chair.status === 'In memoriam' ? 'status memorial' : 'status'}>{chair.status}</span>
                </div>
              </NavLink>
            ))}
          </div>
        </div>
      </section>

      {/* Acervo */}
      <section className="archive-section">
        <div className="wrap">
          <div className="section-heading">
            <div>
              <h2>O <em>acervo</em></h2>
            </div>
            <NavLink className="action-pill home-section-action" to="/acervo">Ver acervo completo <ArrowUpRight size={15} aria-hidden="true" /></NavLink>
          </div>
          <div className="bookshelf">
            <LoadState {...acervo} />
            {publications.map((book) => (
              <article className="book-entry" key={book.id}>
                <div className={`book-cover ${book.color}`}>
                  <span>A.L.L.</span>
                  <strong>{book.title}</strong>
                  <small>{book.tomo}</small>
                  <i>❧</i>
                </div>
                <div className="book-details">
                  <p className="meta">Publicação · {book.year}</p>
                  <h3><NavLink className="book-title-link" to={`/acervo?ler=${encodeURIComponent(String(book.id))}`}>{book.title}</NavLink></h3>
                  <p>{book.author}<br />Edição da Academia Limoeirense de Letras</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Próximo evento */}
      {nextEvent && <section className="home-event-section">
        <div className="wrap">
          <div className="section-heading home-event-heading">
            <h2>Próximo <em>evento</em></h2>
            <NavLink className="action-pill" to="/agenda">Ver agenda completa <ArrowUpRight size={15} aria-hidden="true" /></NavLink>
          </div>
          <article className="home-event-card">
            <div className="home-event-date" aria-label={formatData(nextEvent.data)}>
              <span>{formatMes(nextEvent.data)}</span>
              <strong>{formatDia(nextEvent.data)}</strong>
            </div>
            <div className="home-event-copy">
              <span className="home-event-type">{nextEvent.tipo}</span>
              <h3>{nextEvent.titulo}</h3>
              <div className="home-event-meta">
                <span><Clock3 size={14} aria-hidden="true" />{formatData(nextEvent.data)} · {nextEvent.hora}</span>
                <span><MapPin size={14} aria-hidden="true" />{nextEvent.local}</span>
              </div>
              <NavLink className="action-pill" to="/agenda">Ver detalhes <ArrowUpRight size={14} aria-hidden="true" /></NavLink>
            </div>
            {nextEvent.foto && <div className="home-event-image"><img src={nextEvent.foto} alt={`Imagem do evento ${nextEvent.titulo}`} loading="lazy" /></div>}
          </article>
        </div>
      </section>}

      {/* Notícias */}
      <section className="news-section">
        <div className="wrap">
          <div className="section-heading news-section-heading">
            <h2>Últimas <em>notícias</em></h2>
            <NavLink className="action-pill home-section-action" to="/noticias">Ver todas as notícias <ArrowUpRight size={15} aria-hidden="true" /></NavLink>
          </div>
          <div className="news-list">
            <LoadState {...noticias} />
            {!noticias.error && noticias.data.map(n => <article key={n.id}>
              <NavLink className="home-news-link" to={`/noticias?id=${n.id}`} aria-label={`Abrir notícia: ${n.titulo}`}>
                <time>{n.data}</time><h3>{n.titulo}</h3>
              </NavLink>
            </article>)}
            {!noticias.loading && !noticias.error && noticias.data.length === 0 && <p>Nenhuma notícia publicada.</p>}
          </div>
        </div>
      </section>
    </main>
  )
}
