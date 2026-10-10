import { fetchNoticiasPage, fetchNoticiaById, emptyPage } from '@/services/api'
import Pagination, { pageFromUrl } from '@/components/Pagination'
import type { Noticia } from '@/types'
import { useResource } from '@/hooks/useResource'
import LoadState from '@/components/LoadState'
import { useCallback } from 'react'
import { ArrowLeft } from 'lucide-react'
import { NavLink, useSearchParams } from 'react-router'

export default function Noticias() {
  const [params] = useSearchParams()
  return <NoticiasConteudo key={params.toString()} />
}

function NoticiasConteudo() {
  const [searchParams, setSearchParams] = useSearchParams()
  const q = searchParams.get('q') || ''
  const cat = searchParams.get('categoria') || 'Todas'
  const page = pageFromUrl(searchParams.get('page'))
  const setPage = (value: number) => {
    const next = new URLSearchParams(searchParams)
    next.set('page', String(value))
    setSearchParams(next)
  }
  const id = searchParams.get('id')
  const aberta = id === null ? null : /^\d+$/.test(id) ? Number(id) : NaN
  const setAberta = (id: number | null) => {
    const next = new URLSearchParams(searchParams)
    if (id === null) next.delete('id'); else next.set('id', String(id))
    setSearchParams(next)
  }
  const noticiaHref = (newsId: number) => {
    const next = new URLSearchParams(searchParams)
    next.set('id', String(newsId))
    return `?${next.toString()}`
  }

  const load = useCallback(async (signal: AbortSignal) => {
    if (aberta === null) return fetchNoticiasPage(page, cat, q, signal)
    if (!Number.isSafeInteger(aberta) || aberta < 1) return emptyPage<Noticia>()
    const noticia = await fetchNoticiaById(aberta, signal)
    return { ...emptyPage<Noticia>(), items: noticia ? [noticia] : [] }
  }, [aberta, cat, q, page])
  const state = useResource(load, emptyPage<Noticia>())
  if (state.loading || state.error) return <main><LoadState {...state} /></main>
  const noticias = state.data.items

  if (aberta !== null && !noticias.some(n => n.id === aberta)) return <main className="wrap"><h1 className="page-title">Notícia não encontrada</h1><button type="button" className="text-link" onClick={() => setAberta(null)}>Voltar às notícias</button></main>
  const lista = noticias

  if (aberta !== null && noticias.some(n => n.id === aberta)) {
    const noticia = noticias.find(n => n.id === aberta)!
    return (
      <main>
        <article className="noticia-full wrap">
          <div className="noticia-detail-topbar">
            <div className="noticia-meta-top">
              <span className="noticia-cat">{noticia.categoria}</span>
              <time>{noticia.data}</time>
            </div>
            <button type="button" className="back-link" onClick={() => setAberta(null)}><ArrowLeft size={14} aria-hidden="true" /> Voltar às notícias</button>
          </div>
          <h1 className="page-title noticia-full-title">{noticia.titulo}</h1>
          <div className="noticia-img-frame">
            <img src={noticia.img} alt={noticia.titulo} loading="eager" fetchPriority="high" />
          </div>
          <div className="noticia-body">
            <p className="lead">{noticia.lede}</p>
            {(noticia.conteudo ?? '').split('\n\n').map((par, i) => <p key={i}>{par}</p>)}
          </div>
        </article>
      </main>
    )
  }

  return (
    <main>
      <section className="page-hero wrap">
        <h1 className="page-title">Notícias</h1>
        <p className="page-lede">{q ? <>Resultados para: <strong>"{q}"</strong></> : 'Acompanhe os acontecimentos, publicações e atividades da Academia Limoeirense de Letras.'}</p>
      </section>

      <section className="noticias-section wrap" data-pagination-start>
        {/* Destaque — primeira notícia */}
        {lista.length > 0 && (
          <article className="noticia-destaque">
            <NavLink className="noticia-destaque-img" to={noticiaHref(lista[0].id)} aria-label={`Ler notícia: ${lista[0].titulo}`}>
              <img src={lista[0].img} alt={lista[0].titulo} loading="eager" />
            </NavLink>
            <div className="noticia-destaque-copy">
              <span className="noticia-cat">{lista[0].categoria}</span>
              <time>{lista[0].data}</time>
              <h2><NavLink className="noticia-title-link" to={noticiaHref(lista[0].id)}>{lista[0].titulo}</NavLink></h2>
              <p>{lista[0].lede}</p>
            </div>
          </article>
        )}

        {/* Grade das demais */}
        {lista.length > 1 && (
          <div className="noticias-grid">
            {lista.slice(1).map(n => (
              <article className="noticia-card" key={n.id}>
                <NavLink className="noticia-card-img" to={noticiaHref(n.id)} aria-label={`Ler notícia: ${n.titulo}`}>
                  <img src={n.img} alt={n.titulo} loading="lazy" decoding="async" />
                </NavLink>
                <div className="noticia-card-body">
                  <div className="noticia-card-meta">
                    <span className="noticia-cat">{n.categoria}</span>
                    <time>{n.data}</time>
                  </div>
                  <h3><NavLink className="noticia-title-link" to={noticiaHref(n.id)}>{n.titulo}</NavLink></h3>
                  <p>{n.lede}</p>
                </div>
              </article>
            ))}
          </div>
        )}

        {lista.length === 0 && (
          <div className="empty-search noticias-empty">
            <h3>Nenhuma notícia encontrada</h3>
            <p>Tente outro filtro ou termo de busca.</p>
          </div>
        )}
        <Pagination page={state.data.page} totalPages={state.data.totalPages} onChange={setPage} />
      </section>
    </main>
  )
}
