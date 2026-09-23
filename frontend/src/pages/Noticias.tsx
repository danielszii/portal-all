import { fetchNoticiasPage, fetchNoticiaById, emptyPage } from '@/services/api'
import Pagination, { pageFromUrl } from '@/components/Pagination'
import type { Noticia } from '@/types'
import { useResource } from '@/hooks/useResource'
import LoadState from '@/components/LoadState'
import { useCallback } from 'react'
import { ArrowUpRight } from 'lucide-react'
import { useSearchParams } from 'react-router'


import { CATEGORIAS_NOTICIAS as categorias } from '@/constants'

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
  const setCat = (categoria: string) => {
    const next = new URLSearchParams(searchParams)
    if (categoria === 'Todas') next.delete('categoria'); else next.set('categoria', categoria)
    next.delete('id')
    next.delete('page')
    setSearchParams(next)
  }
  const id = searchParams.get('id')
  const aberta = id === null ? null : /^\d+$/.test(id) ? Number(id) : NaN
  const setAberta = (id: number | null) => {
    const next = new URLSearchParams(searchParams)
    if (id === null) next.delete('id'); else next.set('id', String(id))
    setSearchParams(next)
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

  if (aberta !== null && !noticias.some(n => n.id === aberta)) return <main className="wrap"><h1 className="page-title">Notícia não encontrada</h1><button className="text-link" onClick={() => setAberta(null)}>Voltar às notícias</button></main>
  const lista = noticias

  if (aberta !== null && noticias.some(n => n.id === aberta)) {
    const noticia = noticias.find(n => n.id === aberta)!
    return (
      <main>
        <article className="noticia-full wrap">
          <button className="back-link" onClick={() => setAberta(null)}>← Voltar às notícias</button>
          <div className="noticia-meta-top">
            <span className="noticia-cat">{noticia.categoria}</span>
            <time>{noticia.data}</time>
          </div>
          <h1 className="page-title noticia-full-title">{noticia.titulo}</h1>
          <div className="noticia-img-frame">
            <img src={noticia.img} alt={noticia.titulo} />
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
        <h1 className="page-title"><em>Notícias</em></h1>
        <p className="page-lede">{q ? <>Resultados para: <strong>"{q}"</strong></> : 'Acompanhe os acontecimentos, publicações e atividades da Academia Limoeirense de Letras.'}</p>
      </section>

      <section className="noticias-section wrap">
        <div className="cadeiras-filtros">
          {categorias.map(c => (
            <button key={c} aria-pressed={cat === c} className={`filtro-btn ${cat === c ? 'active' : ''}`} onClick={() => setCat(c)}>{c}</button>
          ))}
          <span className="filtro-count">{state.data.total} notícia{state.data.total !== 1 ? 's' : ''}</span>
        </div>

        {/* Destaque — primeira notícia */}
        {lista.length > 0 && (
          <div className="noticia-destaque" role="button" tabIndex={0} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setAberta(lista[0].id) } }} onClick={() => setAberta(lista[0].id)}>
            <div className="noticia-destaque-img">
              <img src={lista[0].img} alt={lista[0].titulo} />
            </div>
            <div className="noticia-destaque-copy">
              <span className="noticia-cat">{lista[0].categoria}</span>
              <time>{lista[0].data}</time>
              <h2>{lista[0].titulo}</h2>
              <p>{lista[0].lede}</p>
              <span className="text-link noticia-read-link">Ler notícia <ArrowUpRight size={14} /></span>
            </div>
          </div>
        )}

        {/* Grade das demais */}
        {lista.length > 1 && (
          <div className="noticias-grid">
            {lista.slice(1).map(n => (
              <article className="noticia-card" role="button" tabIndex={0} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setAberta(n.id) } }} key={n.id} onClick={() => setAberta(n.id)}>
                <div className="noticia-card-img">
                  <img src={n.img} alt={n.titulo} />
                </div>
                <div className="noticia-card-body">
                  <div className="noticia-card-meta">
                    <span className="noticia-cat">{n.categoria}</span>
                    <time>{n.data}</time>
                  </div>
                  <h3>{n.titulo}</h3>
                  <p>{n.lede}</p>
                  <span className="noticia-link">Ler notícia <ArrowUpRight size={13} /></span>
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
