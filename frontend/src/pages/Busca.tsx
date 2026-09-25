import { useCallback, useEffect, useRef, useState } from 'react'
import { NavLink, useSearchParams } from 'react-router'
import { fetchSearchPage, emptySearchPage } from '@/services/api'
import { useResource } from '@/hooks/useResource'
import LoadState from '@/components/LoadState'
import { formatNumeroCadeira } from '@/utils/formatters'

export default function Busca() {
  const [params] = useSearchParams()
  const q = params.get('q')?.trim() ?? ''
  return <BuscaConteudo key={q} q={q} />
}

function BuscaConteudo({ q }: { q: string }) {
  const [page, setPage] = useState(1)
  const [results, setResults] = useState(emptySearchPage)
  const sentinel = useRef<HTMLDivElement>(null)
  const load = useCallback((signal: AbortSignal) => q ? fetchSearchPage(q, page, signal) : Promise.resolve(emptySearchPage), [q, page])
  const state = useResource(load, emptySearchPage)
  useEffect(() => {
    if (state.loading || state.error || state.data.page !== page) return
    setResults(current => {
      if (current.page >= page) return current
      const merge = <T,>(previous: T[], next: T[], key: (item: T) => string | number) => [...new Map([...previous, ...next].map(item => [key(item), item])).values()]
      return { ...state.data,
        cadeiras: merge(current.cadeiras, state.data.cadeiras, c => c.number),
        noticias: merge(current.noticias, state.data.noticias, n => n.id),
        acervo: merge(current.acervo, state.data.acervo, a => a.id),
      }
    })
  }, [state.data, state.loading, state.error, page])
  useEffect(() => {
    if (state.loading || state.error || results.page !== page || page >= results.totalPages || !sentinel.current) return
    let requested = false
    const observer = new IntersectionObserver(entries => {
      if (!requested && entries.some(entry => entry.isIntersecting)) {
        requested = true
        setPage(current => current + 1)
      }
    }, { rootMargin: '300px' })
    observer.observe(sentinel.current)
    return () => observer.disconnect()
  }, [state.loading, state.error, results.page, results.totalPages, page])
  return <main>
    <section className="page-hero wrap"><h1 className="page-title">Resultados da <em>busca</em></h1><p className="page-lede">{q ? `Conteúdos encontrados para “${q}” em todo o portal.` : 'Pesquise cadeiras, notícias e publicações da Academia em um só lugar.'}</p></section>
    {results.page === 0 && <LoadState {...state} />}
    {results.page > 0 && q && <section className="page-section search-results wrap">
      {results.cadeiras.length + results.noticias.length + results.acervo.length === 0 && <div className="empty-search"><h3>Nenhum resultado</h3><p>Tente pesquisar por outro nome, título ou palavra-chave.</p></div>}
      {results.cadeiras.map(c => <article className="search-result" key={c.number}><span className="meta">Cadeira</span><NavLink to={`/cadeiras/${c.number.toLowerCase()}`}>Cadeira {formatNumeroCadeira(c.number)} — {c.holder} · {c.patron}</NavLink></article>)}
      {results.noticias.map(n => <article className="search-result" key={n.id}><span className="meta">Notícia</span><NavLink to={`/noticias?id=${n.id}`}>{n.titulo}</NavLink></article>)}
      {results.acervo.map(a => <article className="search-result" key={a.id}><span className="meta">Acervo</span><NavLink to={`/acervo?q=${encodeURIComponent(a.title)}`}>{a.title} — {a.author}</NavLink></article>)}
      <LoadState loading={false} error={state.error} retry={state.retry} />
      <div ref={sentinel} aria-hidden="true" />
    </section>}
  </main>
}
