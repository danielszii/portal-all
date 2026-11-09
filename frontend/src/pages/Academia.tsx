import { useInstituicao } from '@/hooks/useInstituicao'
import LoadState from '@/components/LoadState'
import { NavLink } from 'react-router'
import { useState } from 'react'
import { ArrowUpRight, ChevronDown, ChevronUp } from 'lucide-react'
import PortalText from '@/components/PortalText'
import FormattedText from '@/components/FormattedText'


export default function Academia() {
  const state = useInstituicao()
  const [hinoExpandido, setHinoExpandido] = useState(false)
  if (state.loading || state.error) return <main><LoadState {...state} /></main>
  const info = state.data.info
  const gestao = state.data.gestao
  const diretoria = gestao?.diretoria ?? []
  const paragraphs = (value: string | null | undefined) => value ? value.split('\n\n').map((text, i) => <p className="formatted-text" key={i}><FormattedText text={text} /></p>) : <p>Informação ainda não disponibilizada.</p>
  const hino = info?.hinoLetra?.trim() ?? ''
  const hinoLinhas = hino.split('\n')
  const hinoPrecisaExpandir = hino.length > 420 || hinoLinhas.length > 8
  const limitePrevia = hinoLinhas.slice(0, 8).join('\n').slice(0, 420)
  const hinoPrevia = hinoPrecisaExpandir ? limitePrevia.replace(/\s+\S*$/u, '').trimEnd() : hino

  return (
    <main>

      {/* ── Hero da página ── */}
      <section className="page-hero wrap">
        <h1 className="page-title">Academia</h1>
        <PortalText className="page-lede" field="academiaIntroducao" />
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

      {hino && <>
        <div className="academia-divider wrap" />
        <section className="academia-section academia-hino wrap">
          <div className="academia-grid">
            <div className="academia-grid-label">
              <span className="eyebrow">Símbolos e tradições</span>
            </div>
            <div className="academia-grid-body">
              <h2 className="academia-h2">{info?.hinoTitulo?.trim() || 'Hino da Academia'}</h2>
              {info?.hinoAutoria && <p className="academia-hino-autoria">Autoria: {info.hinoAutoria}</p>}
              <div id="letra-hino" className={`academia-hino-letra${!hinoExpandido && hinoPrecisaExpandir ? ' is-preview' : ''}`}>
                {paragraphs(hinoExpandido ? hino : hinoPrevia)}
              </div>
              {hinoPrecisaExpandir && <button
                className="action-pill academia-hino-toggle"
                type="button"
                aria-expanded={hinoExpandido}
                aria-controls="letra-hino"
                onClick={() => setHinoExpandido(value => !value)}
              >
                {hinoExpandido ? 'Recolher hino' : 'Ver hino completo'}
                {hinoExpandido ? <ChevronUp size={16} aria-hidden="true" /> : <ChevronDown size={16} aria-hidden="true" />}
              </button>}
            </div>
          </div>
        </section>
      </>}

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
          <div className="section-actions">
            <NavLink className="action-pill" to="/contato">
              Fale com a Academia <ArrowUpRight size={15} aria-hidden="true" />
            </NavLink>
            <NavLink className="action-pill" to="/acervo">
              Ver publicações <ArrowUpRight size={15} aria-hidden="true" />
            </NavLink>
          </div>
        </div>
      </section>

    </main>
  )
}
