import { fetchAcervoPage, fetchAcervoById, fetchBibliotecaPage, emptyPage } from '@/services/api'
import Pagination, { pageFromUrl } from '@/components/Pagination'
import type { AcervoItem, LivroBiblioteca } from '@/types'
import { useSearchParams } from 'react-router'
import { useDialog } from '@/hooks/useDialog'
import { useResource } from '@/hooks/useResource'
import LoadState from '@/components/LoadState'
import PortalText from '@/components/PortalText'
import FormattedText from '@/components/FormattedText'
import { useState, useCallback, useEffect, type FormEvent } from 'react'
import { ArrowUpRight, Search, X, Download, ShoppingBag, LibraryBig } from 'lucide-react'
import { pdfViewerUrl, publicationImageUrl } from '@/utils/pdf'

type Pub = AcervoItem

function PdfModal({ pub, onClose }: { pub: Pub; onClose: () => void }) {
  const dialog = useDialog(onClose)
  const imageUrl = publicationImageUrl(pub.pdf, window.location.origin)
  const viewerUrl = imageUrl ? undefined : pdfViewerUrl(pub.pdf, window.location.origin)
  return (
    <div ref={dialog} tabIndex={-1} className="pdf-overlay" role="dialog" aria-modal="true" aria-labelledby="pdf-modal-title" onClick={onClose}>
      <div className="pdf-modal" onClick={e => e.stopPropagation()}>
        <div className="pdf-modal-header">
          <div>
            <p className="eyebrow modal-eyebrow">{pub.type} · {pub.year}</p>
            <h2 className="pdf-modal-title" id="pdf-modal-title">{pub.title} <em>{pub.tomo}</em></h2>
          </div>
          <div className="pdf-modal-actions">
            {pub.purchaseUrl && <a className="pdf-purchase-btn" href={pub.purchaseUrl} target="_blank" rel="noopener noreferrer">
              <ShoppingBag size={13} aria-hidden="true" /> Comprar exemplar <span className="visually-hidden">(abre o site de venda em nova aba)</span>
            </a>}
            <a className="pdf-download-btn" href={pub.pdf} download target="_blank" rel="noopener noreferrer">
              <Download size={13} aria-hidden="true" /> Baixar {imageUrl ? 'imagem' : 'PDF'} <span className="visually-hidden">(abre em nova aba)</span>
            </a>
            <button type="button" className="pdf-close" onClick={onClose} aria-label="Fechar visualizador">
              <X size={18} aria-hidden="true" />
            </button>
          </div>
        </div>
        <div className="pdf-viewer">
          {imageUrl ? <img className="publication-image" src={imageUrl} alt={`Publicação ${pub.title}`} /> : <iframe
            src={viewerUrl}
            title={`${pub.title} — ${pub.tomo}`}
            width="100%"
            height="100%"
            className="pdf-frame"
          />}
        </div>
        <div className="pdf-modal-footer">
          <span>{pub.pages} páginas · {pub.author}</span>
        </div>
      </div>
    </div>
  )
}

function BibliotecaFisica() {
  const [page, setPage] = useState(1)
  const [query, setQuery] = useState('')
  const [search, setSearch] = useState('')
  const load = useCallback((signal: AbortSignal) => fetchBibliotecaPage(page, search, signal), [page, search])
  const state = useResource(load, emptyPage<LivroBiblioteca>())
  const submit = (event: FormEvent) => {
    event.preventDefault()
    setPage(1)
    setSearch(query.trim())
  }

  return <section className="library-section" data-pagination-start aria-labelledby="library-title">
    <div className="wrap">
      <div className="section-heading library-heading">
        <div>
          <p className="eyebrow">Consulta presencial</p>
          <h2 id="library-title">Biblioteca <em>física</em></h2>
          <p>Consulte a relação de livros que integram a biblioteca da Academia.</p>
        </div>
        <LibraryBig size={36} strokeWidth={1.3} aria-hidden="true" />
      </div>

      <form className="library-search" role="search" onSubmit={submit}>
        <label className="search-control">
          <Search size={16} aria-hidden="true" />
          <span className="visually-hidden">Buscar no catálogo físico</span>
          <input value={query} maxLength={200} placeholder="Buscar por título, autor, editora ou tombo" onChange={event => setQuery(event.target.value)} />
          <button type="submit"><span>Buscar</span></button>
        </label>
        {search && <button type="button" className="library-clear" onClick={() => { setQuery(''); setSearch(''); setPage(1) }}>Limpar busca</button>}
      </form>

      <LoadState {...state} />
      {!state.loading && !state.error && state.data.items.length === 0 && <div className="library-empty" role="status">
        <LibraryBig size={28} aria-hidden="true" />
        <p>{search ? 'Nenhum livro encontrado para esta busca.' : 'O catálogo físico ainda não possui livros publicados.'}</p>
      </div>}
      {!state.loading && !state.error && state.data.items.length > 0 && <div className="library-list">
        {state.data.items.map(book => <article className="library-book" key={book.id}>
          <div className="library-book-main">
            <span className="library-book-mark" aria-hidden="true"><LibraryBig size={18} /></span>
            <div>
              <h3>{book.titulo}</h3>
              <p>{book.autor || 'Autoria não informada'}</p>
            </div>
          </div>
          <dl>
            {(book.editora || book.ano) && <div><dt>Edição</dt><dd>{[book.editora, book.ano].filter(Boolean).join(' · ')}</dd></div>}
            {book.tombo && <div><dt>Tombo</dt><dd>{book.tombo}</dd></div>}
            {book.localizacao && <div><dt>Localização</dt><dd>{book.localizacao}</dd></div>}
            <div><dt>Exemplares</dt><dd>{book.quantidade}</dd></div>
          </dl>
          {book.observacoes && <p className="library-book-note"><FormattedText text={book.observacoes} /></p>}
        </article>)}
      </div>}
      {!state.loading && !state.error && <Pagination page={state.data.page} totalPages={state.data.totalPages} onChange={setPage} />}
    </div>
  </section>
}

export default function Acervo() {
  const [params] = useSearchParams()
  return <AcervoConteudo key={params.toString()} />
}

function AcervoConteudo() {
  const [params, setParams] = useSearchParams()
  const busca = params.get('q') ?? ''
  const leituraId = params.get('ler')
  const tipo = params.get('tipo') || 'Todos'
  const page = pageFromUrl(params.get('page'))
  const update = (key: string, value: string) => {
    const next = new URLSearchParams(params)
    if (value) next.set(key, value); else next.delete(key)
    if (key !== 'page') next.delete('page')
    next.delete('ler')
    setParams(next)
  }
  const [pdfAberto, setPdfAberto] = useState<Pub | null>(null)

  const load = useCallback((signal: AbortSignal) => fetchAcervoPage(page, tipo, busca, signal), [page, tipo, busca])
  const state = useResource(load, emptyPage<Pub>())
  const loadDetail = useCallback((signal: AbortSignal) => leituraId ? fetchAcervoById(leituraId, signal) : Promise.resolve(null), [leituraId])
  const detail = useResource<Pub | null>(loadDetail, null)

  useEffect(() => {
    if (leituraId && detail.data && !detail.error) setPdfAberto(detail.data)
  }, [leituraId, detail.data, detail.error])

  const closePdf = () => {
    setPdfAberto(null)
    if (!leituraId) return
    const nextParams = new URLSearchParams(params)
    nextParams.delete('ler')
    setParams(nextParams, { replace: true })
  }

  if (state.loading || state.error) return <main><LoadState {...state} /></main>
  const lista = state.data.items

  return (
    <main>
      {leituraId && <LoadState {...detail} />}
      {pdfAberto && <PdfModal pub={pdfAberto} onClose={closePdf} />}

      <section className="archive-hero wrap">
        <h1 className="page-title">Acervo</h1>
        <PortalText className="page-lede" field="acervoIntroducao" />
      </section>

      <section className="archive-catalog wrap" data-pagination-start>
        {lista.length === 0 ? (
          <div className="empty-search" role="status">
            <Search size={32} color="var(--line)" aria-hidden="true" />
            <h3>Nenhum resultado</h3>
            <p>Tente outros termos ou remova o filtro de tipo.</p>
          </div>
        ) : (
          <div className="archive-grid">
            {lista.map(book => (
              <article className="archive-book" key={book.id}>
                <button type="button" className="archive-cover-button" onClick={() => setPdfAberto(book)} aria-label={`Ver detalhes de ${book.title}`}>
                  <span className={`archive-cover ${book.color} ${book.cover ? 'has-image' : ''}`}>
                    {book.cover ? <img src={book.cover} alt={`Capa de ${book.title}`} /> : <>
                    <span>A.L.L.</span>
                    <strong>{book.title}</strong>
                    <small>{book.tomo}</small>
                    <i>❧</i></>}
                  </span>
                </button>
                <div className="archive-book-info">
                  <div className="archive-book-top">
                    <span className="book-type">{book.type}</span>
                    <span>{book.year}</span>
                  </div>
                  <h3><button type="button" className="archive-title-button" onClick={() => setPdfAberto(book)}>{book.title}</button></h3>
                  <p className="formatted-text"><FormattedText text={book.desc} /></p>
                  <p className="archive-book-pages">{book.pages} páginas · {book.author}</p>
                  {book.purchaseUrl && <span className="archive-purchase-badge"><ShoppingBag size={13} aria-hidden="true" /> Disponível para compra</span>}
                  <div className="archive-book-actions">
                    <button type="button" className="archive-book-link archive-book-link-primary" onClick={() => setPdfAberto(book)}>
                      <span className="archive-action-long">{book.purchaseUrl ? 'Ver detalhes' : 'Ler / visualizar'}</span>
                      <span className="archive-action-short">{book.purchaseUrl ? 'Detalhes' : 'Visualizar'}</span>
                      <ArrowUpRight size={14} aria-hidden="true" />
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
        <Pagination page={state.data.page} totalPages={state.data.totalPages} onChange={value => update('page', String(value))} />
      </section>
      <BibliotecaFisica />
    </main>
  )
}
