import { useResource } from '@/hooks/useResource'
import LoadState from '@/components/LoadState'
import { useEffect, useState } from 'react'
import { fetchInicioCadeiras, fetchInicioAcervo, fetchInicioNoticias, fetchInstituicao } from '@/services/api'
import { ArrowUpRight } from 'lucide-react'
import { NavLink } from 'react-router'
import heroImg from '@/imports/academialetters.png'
import MemberPhotoFrame from '@/components/MemberPhotoFrame'
import { formatNumeroCadeira } from '@/utils/formatters'

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
  useEffect(() => {
    const timer = window.setInterval(() => setCurrentHero(current => (current + 1) % heroSlides.length), 6500)
    return () => window.clearInterval(timer)
  }, [])

  const cadeiras = useResource(fetchInicioCadeiras, { total: 0, items: [] })
  const acervo = useResource(fetchInicioAcervo, { total: 0, items: [] })
  const noticias = useResource(fetchInicioNoticias, [])
  const instituicao = useResource(fetchInstituicao, { info: null, gestao: null })
  const chairs = cadeiras.error ? [] : cadeiras.data.items
  const publications = acervo.error ? [] : acervo.data.items

  return (
    <main className="home-page">
      {/* Hero */}
      <section id="inicio" className="hero">
        <div className="hero-bg">
          <img src={heroImg} alt="Fachada da Academia Limoeirense de Letras, Limoeiro do Norte — CE" />
          <div className="hero-overlay" />
        </div>
        <div className="hero-copy">
          <div className="hero-message" key={currentHero}>
            <h1>{heroSlides[currentHero].title}<br /><em>{heroSlides[currentHero].emphasis}</em></h1>
            <p className="hero-intro">{heroSlides[currentHero].description}</p>
          </div>
        </div>
        <div className="hero-index" aria-label="Selecionar mensagem em destaque">
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
          <NavLink className="text-link centered-link" to="/cadeiras">Consultar quadro completo <ArrowUpRight size={15} /></NavLink>
        </div>
      </section>

      {/* Acervo */}
      <section className="archive-section">
        <div className="wrap">
          <div className="section-heading">
            <div>
              <h2>O <em>acervo</em></h2>
            </div>
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
          <NavLink className="text-link centered-link" to="/acervo">
            Consultar acervo completo <ArrowUpRight size={15} />
          </NavLink>
        </div>
      </section>

      {/* Notícias */}
      <section className="news-section">
        <div className="wrap">
          <div className="section-heading news-section-heading">
            <h2>Últimas <em>notícias</em></h2>
          </div>
          <div className="news-list">
            <LoadState {...noticias} />
            {!noticias.error && noticias.data.map(n => <article key={n.id}>
              <time>{n.data}</time><h3>{n.titulo}</h3>
              <NavLink to={`/noticias?id=${n.id}`}>Ler notícia <ArrowUpRight size={14} /></NavLink>
            </article>)}
            {!noticias.loading && !noticias.error && noticias.data.length === 0 && <p>Nenhuma notícia publicada.</p>}
          </div>
        </div>
      </section>
    </main>
  )
}
