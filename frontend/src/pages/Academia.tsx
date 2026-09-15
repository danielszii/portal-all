import { useCallback } from 'react'
import { fetchInstituicao } from '@/services/api'
import { useResource } from '@/hooks/useResource'
import LoadState from '@/components/LoadState'
import { NavLink } from 'react-router'
import { ArrowUpRight } from 'lucide-react'


export default function Academia() {
  const load = useCallback((signal: AbortSignal) => fetchInstituicao(signal), [])
  const state = useResource(load, { info: null, gestao: null })
  if (state.loading || state.error) return <main><LoadState {...state} /></main>
  const info = state.data.info
  const gestao = state.data.gestao
  const diretoria = gestao?.diretoria ?? []
  const paragraphs = (value: string | null | undefined) => value ? value.split('\n\n').map((text, i) => <p key={i}>{text}</p>) : <p>Informação ainda não disponibilizada.</p>

  return (
    <main>

      {/* ── Hero da página ── */}
      <section className="page-hero wrap">
        <p className="eyebrow">Sobre a instituição</p>
        <h1 className="page-title">A <em>Academia</em></h1>
        <p className="page-lede">
          A Academia Limoeirense de Letras existe para valorizar a língua portuguesa, celebrar
          a literatura nacional e preservar a cultura — especialmente a do Vale do Jaguaribe.
        </p>
      </section>

      {/* ── Sobre ── */}
      <section className="academia-section wrap">
        <div className="academia-grid">
          <div className="academia-grid-label">
            <span className="eyebrow">Missão</span>
          </div>
          <div className="academia-grid-body">
            
            {paragraphs(info?.missao)}
            
          </div>
        </div>
      </section>

      {/* ── Linha divisória ── */}
      <div className="academia-divider wrap" />

      {/* ── Fundação ── */}
      <section className="academia-section wrap">
        <div className="academia-grid">
          <div className="academia-grid-label">
            <span className="eyebrow">Fundação</span>
            <strong className="academia-ano">{info?.fundacaoAno ?? '—'}</strong>
          </div>
          <div className="academia-grid-body">
            <h2 className="academia-h2">Uma casa nascida<br /><em>da palavra</em></h2>
            {paragraphs(info?.historia)}
            
          </div>
        </div>
      </section>

      <div className="academia-divider wrap" />

      {/* ── Sede ── */}
      <section className="academia-section wrap">
        <div className="academia-grid">
          <div className="academia-grid-label">
            <span className="eyebrow">Sede</span>
          </div>
          <div className="academia-grid-body">
            <h2 className="academia-h2">O lugar da<br /><em>memória</em></h2>
            {paragraphs(info?.sedeTexto)}
            <div className="academia-endereco"><p className="eyebrow">Endereço</p><p>{info?.endereco ?? 'Endereço ainda não informado.'}</p></div>
          </div>
        </div>
      </section>

      <div className="academia-divider wrap" />

      {/* ── Trajetória ── */}
      <section className="academia-section wrap">
        <div className="academia-grid">
          <div className="academia-grid-label">
            <span className="eyebrow">Trajetória</span>
            <strong className="academia-ano">{info?.fundacaoAno ? new Date().getFullYear() - info.fundacaoAno : '—'}<br /><span>anos</span></strong>
          </div>
          <div className="academia-grid-body">
            <h2 className="academia-h2">Um templo vivo<br /><em>da palavra</em></h2>
            {paragraphs(info?.trajetoriaTexto)}
            
          </div>
        </div>
      </section>

      {/* ── Diretoria ── */}
      <section className="academia-diretoria">
        <div className="wrap">
          <div className="section-heading">
            <div>
              <p className="eyebrow">{gestao ? `Gestão ${gestao.inicioAno}–${gestao.fimAno ?? 'atual'}` : 'Diretoria'}</p>
              <h2>Diretoria <em>atual</em></h2>
            </div>
          </div>
          <div className="diretoria-grid">
            {diretoria.length === 0 && <p>Diretoria ainda não cadastrada.</p>}
            {diretoria.map(d => (
              <div className="diretoria-card" key={d.cargo}>
                <p className="meta">{d.cargo}</p>
                <h3>{d.nome}</h3>
                <p className="diretoria-posse">Posse em {d.posse}</p>
              </div>
            ))}
          </div>
          <div style={{ marginTop: '48px', paddingTop: '32px', borderTop: '1px solid var(--line)', display: 'flex', gap: '32px' }}>
            <NavLink className="text-link" to="/contato">
              Fale com a Academia <ArrowUpRight size={15} />
            </NavLink>
            <NavLink className="text-link" to="/acervo">
              Ver publicações <ArrowUpRight size={15} />
            </NavLink>
          </div>
        </div>
      </section>

    </main>
  )
}
