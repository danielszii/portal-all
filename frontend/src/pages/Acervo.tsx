import { fetchAcervo } from '@/services/api'
import type { AcervoItem } from '@/types'
import { useSearchParams } from 'react-router'
import { useDialog } from '@/hooks/useDialog'
import { useResource } from '@/hooks/useResource'
import LoadState from '@/components/LoadState'
import { useState, useCallback, useEffect } from 'react'
import { ArrowUpRight, Search, X, Download } from 'lucide-react'


const tipos = ['Todos', 'Caderno', 'Antologia', 'Revista', 'Livro', 'Discurso', 'Estatuto']

type Pub = AcervoItem

function PdfModal({ pub, onClose }: { pub: Pub; onClose: () => void }) {
  const dialog = useDialog(onClose)
  return (
    <div ref={dialog} tabIndex={-1} className="pdf-overlay" role="dialog" aria-modal="true" aria-label={`Visualizar: ${pub.title}`} onClick={onClose}>
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
  const [params, setParams] = useSearchParams()
  const busca = params.get('q') ?? ''
  const leituraId = params.get('ler')
  const setBusca = (q: string) => setParams(q ? { q } : {}, { replace: true })
  const [tipo, setTipo] = useState('Todos')
  const [pdfAberto, setPdfAberto] = useState<Pub | null>(null)

  const load = useCallback((signal: AbortSignal) => fetchAcervo(undefined, undefined, signal), [])
  const state = useResource<Pub[]>(load, [])

  useEffect(() => {
    if (!leituraId || state.loading || state.error) return
    const publication = state.data.find(item => String(item.id) === leituraId)
    if (publication) setPdfAberto(publication)
  }, [leituraId, state.data, state.error, state.loading])

  const closePdf = () => {
    setPdfAberto(null)
    if (!leituraId) return
    const nextParams = new URLSearchParams(params)
    nextParams.delete('ler')
    setParams(nextParams, { replace: true })
  }

  if (state.loading || state.error) return <main><LoadState {...state} /></main>
  const publications = state.data
  const lista = publications.filter(p => {
    const matchTipo = tipo === 'Todos' || p.type === tipo
    const matchBusca = !busca || [p.title, p.author, p.year, p.tomo, p.type].some(v => v.toLowerCase().includes(busca.toLowerCase()))
    return matchTipo && matchBusca
  })

  return (
    <main>
      {pdfAberto && <PdfModal pub={pdfAberto} onClose={closePdf} />}

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
          <span>Acesso público e gratuito</span>
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
              <article className="archive-book" key={book.id}>
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
