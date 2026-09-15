import { useState } from 'react'
import { ArrowUpRight, Search, X, Download } from 'lucide-react'

const publications = [
  { title: 'Cadernos do Vale', tomo: 'Tomo VII', year: '2024', color: 'navy', author: 'Vários autores', type: 'Caderno', pages: '184', desc: 'Reunião de poemas, crônicas e contos de acadêmicos e convidados, com destaque para a nova geração de escritores do Vale do Jaguaribe.', pdf: 'https://www.africau.edu/images/general/sample.pdf' },
  { title: 'A palavra e o tempo', tomo: 'Antologia I', year: '2023', color: 'ochre', author: 'Comissão Editorial', type: 'Antologia', pages: '312', desc: 'Seleção histórica da produção literária dos membros da Academia desde sua fundação, organizada cronologicamente.', pdf: 'https://www.africau.edu/images/general/sample.pdf' },
  { title: 'Revista da A.L.L.', tomo: 'N.º 12', year: '2022', color: 'ink', author: 'Academia Limoeirense', type: 'Revista', pages: '96', desc: 'Publicação anual com artigos, ensaios e notícias institucionais. Esta edição comemora os 24 anos da Academia.', pdf: 'https://www.africau.edu/images/general/sample.pdf' },
  { title: 'Cadernos do Vale', tomo: 'Tomo VI', year: '2021', color: 'navy', author: 'Vários autores', type: 'Caderno', pages: '168', desc: 'Edição especial dedicada à poesia de resistência e à memória dos patronos literários da instituição.', pdf: 'https://www.africau.edu/images/general/sample.pdf' },
  { title: 'Memórias do Jaguaribe', tomo: 'Vol. II', year: '2020', color: 'green', author: 'Antônio Freitas (org.)', type: 'Livro', pages: '248', desc: 'Compilação de relatos, memórias e documentos históricos sobre a cultura e a literatura do Vale do Jaguaribe.', pdf: 'https://www.africau.edu/images/general/sample.pdf' },
  { title: 'Estatuto Social da A.L.L.', tomo: 'Edição 2019', year: '2019', color: 'ink', author: 'Academia Limoeirense', type: 'Estatuto', pages: '32', desc: 'Documento oficial com o regimento interno, normas de admissão, estrutura diretiva e obrigações dos acadêmicos da A.L.L.', pdf: 'https://www.africau.edu/images/general/sample.pdf' },
  { title: 'Discurso de Posse — Presidência 2022', tomo: 'Gestão 2022–2026', year: '2022', color: 'ochre', author: 'Francisco de Assis Moura', type: 'Discurso', pages: '12', desc: 'Discurso proferido na cerimônia de posse da presidência 2022–2026. Texto integral com notas da sessão solene.', pdf: 'https://www.africau.edu/images/general/sample.pdf' },
  { title: 'Revista da A.L.L.', tomo: 'N.º 10', year: '2019', color: 'red', author: 'Academia Limoeirense', type: 'Revista', pages: '88', desc: 'Edição de aniversário de 21 anos, com balanço das publicações e homenagens aos fundadores da casa.', pdf: 'https://www.africau.edu/images/general/sample.pdf' },
]

const tipos = ['Todos', 'Caderno', 'Antologia', 'Revista', 'Livro', 'Discurso', 'Estatuto']

type Pub = typeof publications[0]

function PdfModal({ pub, onClose }: { pub: Pub; onClose: () => void }) {
  return (
    <div className="pdf-overlay" role="dialog" aria-modal="true" aria-label={`Visualizar: ${pub.title}`} onClick={onClose}>
      <div className="pdf-modal" onClick={e => e.stopPropagation()}>
        <div className="pdf-modal-header">
          <div>
            <p className="eyebrow" style={{ marginBottom: '4px' }}>{pub.type} · {pub.year}</p>
            <h2 className="pdf-modal-title">{pub.title} <em>{pub.tomo}</em></h2>
          </div>
          <div className="pdf-modal-actions">
            <a className="pdf-download-btn" href={pub.pdf} download target="_blank" rel="noopener noreferrer">
              <Download size={13} /> Baixar PDF
            </a>
            <button className="pdf-close" onClick={onClose} aria-label="Fechar visualizador">
              <X size={18} />
            </button>
          </div>
        </div>
        <div className="pdf-viewer">
          <iframe
            src={`https://docs.google.com/viewer?url=${encodeURIComponent(pub.pdf)}&embedded=true`}
            title={`${pub.title} — ${pub.tomo}`}
            width="100%"
            height="100%"
            style={{ border: 0 }}
          />
        </div>
        <div className="pdf-modal-footer">
          <span>{pub.pages} páginas · {pub.author}</span>
          <a href={pub.pdf} download target="_blank" rel="noopener noreferrer" className="text-link" style={{ marginTop: 0 }}>
            Download direto <ArrowUpRight size={13} />
          </a>
        </div>
      </div>
    </div>
  )
}

export default function Acervo() {
  const [busca, setBusca] = useState('')
  const [tipo, setTipo] = useState('Todos')
  const [pdfAberto, setPdfAberto] = useState<Pub | null>(null)

  const lista = publications.filter(p => {
    const matchTipo = tipo === 'Todos' || p.type === tipo
    const matchBusca = !busca || [p.title, p.author, p.year, p.tomo, p.type].some(v => v.toLowerCase().includes(busca.toLowerCase()))
    return matchTipo && matchBusca
  })

  return (
    <main>
      {pdfAberto && <PdfModal pub={pdfAberto} onClose={() => setPdfAberto(null)} />}

      <section className="archive-hero wrap">
        <p className="eyebrow">Biblioteca digital</p>
        <h1 className="page-title">O <em>acervo</em></h1>
        <p className="archive-lede">
          Edições, cadernos, antologias, revistas, discursos e estatutos publicados pela
          Academia Limoeirense de Letras desde 1998. Acesso gratuito e irrestrito — sem cadastro.
        </p>
      </section>

      <section className="archive-catalog wrap">
        <div className="catalog-toolbar">
          <div>
            <p className="eyebrow">Publicações</p>
            <h2>{lista.length} <em>obras</em></h2>
          </div>
          <form className="archive-search" onSubmit={e => e.preventDefault()}>
            <Search size={14} color="var(--bronze)" strokeWidth={1.5} />
            <input
              type="search"
              placeholder="Buscar por título, autor ou tipo…"
              value={busca}
              onChange={e => setBusca(e.target.value)}
              aria-label="Buscar no acervo"
            />
          </form>
        </div>

        <div className="cadeiras-filtros" style={{ marginBottom: '0', borderBottom: '1px solid var(--line)', paddingBottom: '16px' }}>
          {tipos.map(t => (
            <button key={t} className={`filtro-btn ${tipo === t ? 'active' : ''}`} onClick={() => setTipo(t)}>{t}</button>
          ))}
        </div>

        <div className="catalog-meta">
          <span>{lista.length} publicaç{lista.length !== 1 ? 'ões' : 'ão'} encontrada{lista.length !== 1 ? 's' : ''}</span>
          <span>Acervo atualizado em set. 2026</span>
        </div>

        {lista.length === 0 ? (
          <div className="empty-search">
            <Search size={32} color="var(--line)" />
            <h3>Nenhum resultado</h3>
            <p>Tente outros termos ou remova o filtro de tipo.</p>
          </div>
        ) : (
          <div className="archive-grid">
            {lista.map(book => (
              <article className="archive-book" key={book.title + book.tomo}>
                <div className={`archive-cover ${book.color}`}>
                  <span>A.L.L.</span>
                  <strong>{book.title}</strong>
                  <small>{book.tomo}</small>
                  <i>❧</i>
                </div>
                <div className="archive-book-info">
                  <div className="archive-book-top">
                    <span className="book-type">{book.type}</span>
                    <span>{book.year}</span>
                  </div>
                  <h3>{book.title}</h3>
                  <p>{book.desc}</p>
                  <p className="archive-book-pages">{book.pages} páginas · {book.author}</p>
                  <div className="archive-book-actions">
                    <button className="archive-book-link archive-book-link-primary" onClick={() => setPdfAberto(book)}>
                      [ Ler / Visualizar ]
                    </button>
                    <a className="archive-book-link" href={book.pdf} download target="_blank" rel="noopener noreferrer">
                      [ Baixar PDF ]
                    </a>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  )
}
