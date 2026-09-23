import { fetchAcervoPage, fetchAcervoById, emptyPage } from '@/services/api'
import Pagination, { pageFromUrl } from '@/components/Pagination'
import type { AcervoItem } from '@/types'
import { useSearchParams } from 'react-router'
import { useDialog } from '@/hooks/useDialog'
import { useResource } from '@/hooks/useResource'
import LoadState from '@/components/LoadState'
import { useState, useCallback, useEffect } from 'react'
import { ArrowUpRight, Search, X, Download } from 'lucide-react'


import { TIPOS_ACERVO as tipos } from '@/constants'
import { pdfViewerUrl } from '@/utils/pdf'

type Pub = AcervoItem

function PdfModal({ pub, onClose }: { pub: Pub; onClose: () => void }) {
  const dialog = useDialog(onClose)
  const viewerUrl = pdfViewerUrl(pub.pdf, window.location.origin)
  return (
    <div ref={dialog} tabIndex={-1} className="pdf-overlay" role="dialog" aria-modal="true" aria-label={`Visualizar: ${pub.title}`} onClick={onClose}>
      <div className="pdf-modal" onClick={e => e.stopPropagation()}>
        <div className="pdf-modal-header">
          <div>
            <p className="eyebrow modal-eyebrow">{pub.type} · {pub.year}</p>
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
            src={viewerUrl}
            title={`${pub.title} — ${pub.tomo}`}
            width="100%"
            height="100%"
            className="pdf-frame"
          />
        </div>
        <div className="pdf-modal-footer">
          <span>{pub.pages} páginas · {pub.author}</span>
        </div>
      </div>
    </div>
  )
}

export default function Acervo() {
  const [params] = useSearchParams()
  return <AcervoConteudo key={params.toString()} />
}

function AcervoConteudo() {
  const [params, setParams] = useSearchParams()
  const busca = params.get('q') ?? ''
  const leituraId = params.get('ler')
  const [draft, setDraft] = useState(busca)
  const tipo = params.get('tipo') || 'Todos'
  const page = pageFromUrl(params.get('page'))
  const update = (key: string, value: string) => {
    const next = new URLSearchParams(params)
    if (value) next.set(key, value); else next.delete(key)
    if (key !== 'page') next.delete('page')
    next.delete('ler')
    setParams(next)
  }
  const setTipo = (value: string) => update('tipo', value === 'Todos' ? '' : value)
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
        <h1 className="page-title">O <em>acervo</em></h1>
        <p className="page-lede">
          Edições, cadernos, antologias, revistas, discursos e estatutos publicados pela
          Academia Limoeirense de Letras desde 1998. Acesso gratuito e irrestrito — sem cadastro.
        </p>
      </section>

      <section className="archive-catalog wrap">
        <div className="catalog-toolbar">
          <div>
            <p className="eyebrow">Publicações</p>
            <h2>{state.data.total} <em>obras</em></h2>
          </div>
          <form className="archive-search search-control" role="search" onSubmit={e => { e.preventDefault(); update('q', draft.trim()) }}>
            <Search size={14} strokeWidth={1.5} aria-hidden="true" />
            <input
              type="search"
              placeholder="Buscar por título, autor ou tipo…"
              value={draft}
              onChange={e => setDraft(e.target.value)}
              aria-label="Buscar no acervo"
            />
            <button type="submit"><span>Buscar</span></button>
          </form>
        </div>

        <div className="cadeiras-filtros catalog-filters">
          {tipos.map(t => (
            <button key={t} aria-pressed={tipo === t} className={`filtro-btn ${tipo === t ? 'active' : ''}`} onClick={() => setTipo(t)}>{t}</button>
          ))}
        </div>

        <div className="catalog-meta">
          <span>{state.data.total} publicaç{state.data.total !== 1 ? 'ões' : 'ão'} encontrada{state.data.total !== 1 ? 's' : ''}</span>
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
                      Ler / visualizar <ArrowUpRight size={14} />
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
        <Pagination page={state.data.page} totalPages={state.data.totalPages} onChange={value => update('page', String(value))} />
      </section>
    </main>
  )
}
