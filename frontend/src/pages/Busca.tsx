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
    <section className="page-hero wrap"><p className="eyebrow">Pesquisa no portal</p><h1 className="page-title">Resultados da <em>busca</em></h1><p>{q ? `Resultados para “${q}”` : 'Informe uma palavra-chave no campo de busca.'}</p></section>
    <LoadState {...state} />
    {!state.loading && !state.error && q && <section className="page-section wrap">
      {state.data.cadeiras.length + state.data.noticias.length + state.data.acervo.length === 0 && <p>Nenhum resultado encontrado.</p>}
      {state.data.cadeiras.map(c => <article key={c.number}><NavLink className="text-link" to={`/cadeiras/${c.number.toLowerCase()}`}>Cadeira {c.number} — {c.holder} · {c.patron}</NavLink></article>)}
      {state.data.noticias.map(n => <article key={n.id}><NavLink className="text-link" to={`/noticias?id=${n.id}`}>{n.titulo}</NavLink></article>)}
      {state.data.acervo.map(a => <article key={a.id}><NavLink className="text-link" to={`/acervo?q=${encodeURIComponent(a.title)}`}>{a.title} — {a.author}</NavLink></article>)}
    </section>}
  </main>
}
