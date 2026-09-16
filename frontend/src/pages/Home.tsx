import { useResource } from '@/hooks/useResource'
import LoadState from '@/components/LoadState'
import { useCallback } from 'react'
import { fetchCadeiras, fetchAcervo, fetchNoticias, fetchInstituicao } from '@/services/api'
import { ArrowRight, ArrowUpRight } from 'lucide-react'
import { NavLink } from 'react-router'
import heroImg from '@/imports/academialetras.png'
import MemberPhotoFrame from '@/components/MemberPhotoFrame'

export default function Home() {
  const load = useCallback(async (signal: AbortSignal) => {
    const [cadeiras, acervo, noticias, instituicao] = await Promise.all([fetchCadeiras(undefined, undefined, signal), fetchAcervo(undefined, undefined, signal), fetchNoticias(undefined, undefined, signal), fetchInstituicao(signal)])
    return { cadeiras, acervo, noticias, instituicao }
  }, [])
  const state = useResource(load, { cadeiras: [], acervo: [], noticias: [], instituicao: { info: null, gestao: null } })
  if (state.loading || state.error) return <main><LoadState {...state} /></main>
  const chairs = state.data.cadeiras.filter(c => c.status !== 'Vaga').slice(0, 4)
  const publications = state.data.acervo.slice(0, 3)

  return (
    <main>
      {/* Hero */}
      <section id="inicio" className="hero">
        <div className="hero-bg">
          <img src={heroImg} alt="Fachada da Academia Limoeirense de Letras, Limoeiro do Norte — CE" />
          <div className="hero-overlay" />
        </div>
        <div className="hero-copy">
          <p className="hero-location"><span /> Limoeiro do Norte · CE</p>
          <h1>Literatura<br />que <em>permanece.</em></h1>
          <p className="hero-intro">A Academia Limoeirense de Letras cultivando a memória, a cultura e as palavras de Limoeiro do Norte.</p>
          <NavLink className="hero-cta" to="/academia">Conheça a Academia <ArrowRight size={15} /></NavLink>
          <div className="quote">
            <span className="ornament">❧</span>
            <p>"A literatura é a memória de um povo quando o tempo já não consegue falar."</p>
            <small>— Caderno de notas da Academia</small>
          </div>
        </div>
        <div className="hero-index" aria-hidden="true"><strong>01</strong><span /><small>02</small><small>03</small></div>
        <figcaption className="hero-caption">
          <span>Fig. 01</span> — Sede da Academia Limoeirense de Letras, Limoeiro do Norte — CE.
        </figcaption>
      </section>

      {/* A Instituição */}
      <section className="intro-section wrap">
        <div className="section-rule"><span>—</span><span>A instituição</span><span>—</span></div>
        <div className="intro-grid">
          <h2>Uma casa para<br /><em>a palavra</em></h2>
          <div>
            <p className="lead">Desde sua fundação, a A.L.L. trabalha para que a literatura continue sendo encontro, documento e possibilidade.</p>
            <p>Em torno de seus patronos e acadêmicos, a instituição guarda histórias, promove o pensamento e abre espaço para as novas vozes do Ceará.</p>
            <NavLink className="text-link" to="/acervo?q=estatuto">Leia nosso estatuto <ArrowUpRight size={15} /></NavLink>
          </div>
        </div>
        <div className="facts">
          <div><strong>{state.data.instituicao.info?.fundacaoAno ? new Date().getFullYear() - state.data.instituicao.info.fundacaoAno : '—'}</strong><span>anos de<br />trajetória</span></div>
          <div><strong>{state.data.cadeiras.length}</strong><span>cadeiras<br />acadêmicas</span></div>
          <div><strong>{state.data.acervo.length}</strong><span>publicações<br />no acervo</span></div>
          <div className="fact-note">"A palavra permanece<br />quando tudo passa."</div>
        </div>
      </section>

      {/* Cadeiras */}
      <section className="chairs-section">
        <div className="wrap">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Catálogo histórico</p>
              <h2>Quadro de <em>cadeiras</em></h2>
            </div>
            <p className="heading-note">Conheça os patronos, fundadores<br />e titulares que formam esta casa.</p>
          </div>
          <div className="chair-grid">
            {chairs.map((chair) => (
              <NavLink to={`/cadeiras/${chair.number.toLowerCase()}`} key={chair.number} className="chair" aria-label={`Cadeira ${chair.number} — ${chair.patron}`}>
                <MemberPhotoFrame
                  src={chair.image}
                  alt={`Retrato de ${chair.holder}`}
                  status={chair.status}
                  chairNumber={chair.number}
                  size="md"
                />
                <div className="chair-meta">
                  <span className="chair-number">Cadeira · {chair.number}</span>
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
      <section className="archive-section wrap">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Biblioteca digital</p>
            <h2>O <em>acervo</em></h2>
          </div>
          <p className="heading-note">Edições, cadernos e antologias<br />para ler e guardar.</p>
        </div>
        <div className="bookshelf">
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
                <h3>{book.title}</h3>
                <p>{book.author}<br />Edição da Academia Limoeirense de Letras</p>
                <div className="book-links">
                  <NavLink to={`/acervo?q=${encodeURIComponent(book.title)}`}>[ Ler edição em PDF ]</NavLink>
                  <NavLink to={`/acervo?q=${encodeURIComponent(book.title)}`}>[ Ficha técnica ]</NavLink>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Notícias */}
      <section className="news-section wrap">
        <div className="section-rule"><span>—</span><span>Últimas notícias</span><span>—</span></div>
        <div className="news-list">
          {state.data.noticias.slice(0, 3).map(n => <article key={n.id}>
            <time>{n.data}</time><h3>{n.titulo}</h3>
            <NavLink to={`/noticias?id=${n.id}`}>Ler notícia <ArrowUpRight size={14} /></NavLink>
          </article>)}
          {state.data.noticias.length === 0 && <p>Nenhuma notícia publicada.</p>}
        </div>
      </section>
    </main>
  )
}
