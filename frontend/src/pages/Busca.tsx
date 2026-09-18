import { useCallback } from 'react'
import { NavLink, useSearchParams } from 'react-router'
import { fetchCadeiras, fetchNoticias, fetchAcervo } from '@/services/api'
import { useResource } from '@/hooks/useResource'
import LoadState from '@/components/LoadState'

export default function Busca() {
  const [params] = useSearchParams()
  const q = params.get('q')?.trim() ?? ''
  const load = useCallback(async (signal: AbortSignal) => {
    if (!q) return { cadeiras: [], noticias: [], acervo: [] }
    const [cadeiras, noticias, acervo] = await Promise.all([fetchCadeiras(undefined, q, signal), fetchNoticias(undefined, q, signal), fetchAcervo(undefined, q, signal)])
    return { cadeiras, noticias, acervo }
  }, [q])
  const state = useResource(load, { cadeiras: [], noticias: [], acervo: [] })
  return <main>
    <section className="page-hero wrap"><h1 className="page-title">Resultados da <em>busca</em></h1><p className="page-lede">{q ? `Conteúdos encontrados para “${q}” em todo o portal.` : 'Pesquise cadeiras, notícias e publicações da Academia em um só lugar.'}</p></section>
    <LoadState {...state} />
    {!state.loading && !state.error && q && <section className="page-section search-results wrap">
      {state.data.cadeiras.length + state.data.noticias.length + state.data.acervo.length === 0 && <div className="empty-search"><h3>Nenhum resultado</h3><p>Tente pesquisar por outro nome, título ou palavra-chave.</p></div>}
      {state.data.cadeiras.map(c => <article className="search-result" key={c.number}><span className="meta">Cadeira</span><NavLink to={`/cadeiras/${c.number.toLowerCase()}`}>Cadeira {c.number} — {c.holder} · {c.patron}</NavLink></article>)}
      {state.data.noticias.map(n => <article className="search-result" key={n.id}><span className="meta">Notícia</span><NavLink to={`/noticias?id=${n.id}`}>{n.titulo}</NavLink></article>)}
      {state.data.acervo.map(a => <article className="search-result" key={a.id}><span className="meta">Acervo</span><NavLink to={`/acervo?q=${encodeURIComponent(a.title)}`}>{a.title} — {a.author}</NavLink></article>)}
    </section>}
  </main>
}
