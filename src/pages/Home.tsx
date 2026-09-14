import { ArrowUpRight } from 'lucide-react'
import { NavLink } from 'react-router'
import heroImg from '@/imports/Academia_Limoeirense_de_Letras_-_Full_HD.png'
import { cadeiras } from '@/data/cadeiras'
import MemberPhotoFrame from '@/components/MemberPhotoFrame'

const chairs = cadeiras.filter(c => ['I', 'IV', 'VII', 'XII'].includes(c.number))

const publications = [
  { title: 'Cadernos do Vale', tomo: 'Tomo VII', year: '2024', color: 'navy', author: 'Vários autores' },
  { title: 'A palavra e o tempo', tomo: 'Antologia I', year: '2023', color: 'ochre', author: 'Comissão Editorial' },
  { title: 'Revista da A.L.L.', tomo: 'N.º 12', year: '2022', color: 'ink', author: 'Academia Limoeirense' },
]

export default function Home() {
  return (
    <main>
      {/* Hero */}
      <section id="inicio" className="hero">
        <div className="hero-bg">
          <img src={heroImg} alt="Fachada da Academia Limoeirense de Letras, Limoeiro do Norte — CE" />
          <div className="hero-overlay" />
        </div>
        <div className="hero-copy">
          <h1>A cidade que<br /><em>se escreve</em></h1>
          <p className="hero-intro">A Academia Limoeirense de Letras reúne, preserva e celebra a memória literária do Vale do Jaguaribe.</p>
          <div className="quote">
            <span className="ornament">❧</span>
            <p>"A literatura é a memória de um povo quando o tempo já não consegue falar."</p>
            <small>— Caderno de notas da Academia</small>
          </div>
        </div>
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
            <NavLink className="text-link" to="/academia">Leia nosso estatuto <ArrowUpRight size={15} /></NavLink>
          </div>
        </div>
        <div className="facts">
          <div><strong>28</strong><span>anos de<br />trajetória</span></div>
          <div><strong>40</strong><span>cadeiras<br />acadêmicas</span></div>
          <div><strong>12</strong><span>publicações<br />no acervo</span></div>
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
            <article className="book-entry" key={book.title}>
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
                  <NavLink to="/acervo">[ Ler edição em PDF ]</NavLink>
                  <NavLink to="/acervo">[ Ficha técnica ]</NavLink>
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
          <article>
            <time>28 AGO 2026</time>
            <h3>A.L.L. recebe novos membros em sessão solene</h3>
            <NavLink to="/noticias">Ler notícia <ArrowUpRight size={14} /></NavLink>
          </article>
          <article>
            <time>14 JUL 2026</time>
            <h3>Aberta a chamada para a Antologia do Vale</h3>
            <NavLink to="/noticias">Ler notícia <ArrowUpRight size={14} /></NavLink>
          </article>
          <article>
            <time>02 JUN 2026</time>
            <h3>Acervo digital ganha nova coleção de manuscritos</h3>
            <NavLink to="/noticias">Ler notícia <ArrowUpRight size={14} /></NavLink>
          </article>
        </div>
      </section>
    </main>
  )
}
