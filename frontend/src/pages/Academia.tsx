import { useInstituicao } from '@/hooks/useInstituicao'
import LoadState from '@/components/LoadState'
import { NavLink } from 'react-router'
import { ArrowUpRight, Play } from 'lucide-react'
import PortalText from '@/components/PortalText'
import FormattedText from '@/components/FormattedText'
import { youtubeThumbnail, youtubeVideoId } from '@/utils/youtube'


export default function Academia() {
  const state = useInstituicao()
  if (state.loading || state.error) return <main><LoadState {...state} /></main>
  const info = state.data.info
  const gestao = state.data.gestao
  const diretoria = gestao?.diretoria ?? []
  const conselhos = [
    { id: 'DIRETOR', nome: 'Conselho Diretor' },
    { id: 'CONSULTIVO', nome: 'Conselho Consultivo' },
    { id: 'FISCAL', nome: 'Conselho Fiscal' },
  ] as const
  const conselhosComIntegrantes = conselhos.map(conselho => ({
    ...conselho,
    integrantes: diretoria.filter(item => (item.conselho ?? 'DIRETOR') === conselho.id),
  })).filter(conselho => conselho.integrantes.length)
  const paragraphs = (value: string | null | undefined) => value ? value.split('\n\n').map((text, i) => <p className="formatted-text" key={i}><FormattedText text={text} /></p>) : <p>Informação ainda não disponibilizada.</p>
  const hino = info?.hinoLetra?.trim() ?? ''
  const hinoLinhas = hino.split('\n')
  const limitePrevia = hinoLinhas.slice(0, 3).join('\n').slice(0, 220)
  const hinoPrevia = limitePrevia.replace(/\s+\S*$/u, '').trimEnd() || limitePrevia
  const hinoVideoId = youtubeVideoId(info?.hinoVideoUrl)
  const hasHymn = Boolean(hino || info?.hinoApresentacao?.trim() || hinoVideoId)

  return (
    <main>

      {/* ── Hero da página ── */}
      <section className="page-hero wrap">
        <h1 className="page-title">Academia</h1>
        <PortalText className="page-lede" field="academiaIntroducao" />
      </section>

      {/* ── Sobre ── */}
      <section className="academia-section academia-editorial wrap">
        <header className="academia-editorial-heading">
          <p className="eyebrow">Missão</p>
          <h2 className="academia-h2">Literatura, cultura<br /><em>e pertencimento</em></h2>
        </header>
        <div className="academia-editorial-text academia-editorial-lede">{paragraphs(info?.missao)}</div>
      </section>

      {/* ── Linha divisória ── */}
      <div className="academia-divider wrap" />

      {/* ── Fundação ── */}
      <section className="academia-section academia-editorial wrap">
        <header className="academia-editorial-heading">
          <div><p className="eyebrow">Fundação</p><h2 className="academia-h2">Uma casa nascida<br /><em>da palavra</em></h2></div>
          <strong className="academia-editorial-stat"><span>Desde</span>{info?.fundacaoAno ?? '—'}</strong>
        </header>
        <div className="academia-editorial-text">{paragraphs(info?.historia)}</div>
      </section>

      <div className="academia-divider wrap" />

      {/* ── Sede ── */}
      <section className="academia-section academia-editorial wrap">
        <header className="academia-editorial-heading">
          <div><p className="eyebrow">Sede</p><h2 className="academia-h2">O lugar da<br /><em>memória</em></h2></div>
          <div className="academia-editorial-note"><span>Onde estamos</span><p>{info?.endereco ?? 'Endereço ainda não informado.'}</p></div>
        </header>
        <div className="academia-editorial-text">{paragraphs(info?.sedeTexto)}</div>
      </section>

      <div className="academia-divider wrap" />

      {/* ── Trajetória ── */}
      <section className="academia-section academia-editorial wrap">
        <header className="academia-editorial-heading">
          <div><p className="eyebrow">Trajetória</p><h2 className="academia-h2">Um templo vivo<br /><em>da palavra</em></h2></div>
          <strong className="academia-editorial-stat"><span>História</span>{info?.fundacaoAno ? new Date().getFullYear() - info.fundacaoAno : '—'} <small>anos</small></strong>
        </header>
        <div className="academia-editorial-text">{paragraphs(info?.trajetoriaTexto)}</div>
      </section>

      {hasHymn && <>
        <div className="academia-divider wrap" />
        <section className="academia-section academia-editorial academia-hino wrap">
          <header className="academia-editorial-heading"><div><p className="eyebrow">Símbolos e tradições</p><h2 className="academia-h2">A voz da<br /><em>Academia</em></h2></div></header>
              <div className={`academia-hino-card${hinoVideoId ? ' has-video' : ''}`}>
                {hinoVideoId && <div className="academia-hino-thumb" aria-hidden="true">
                  <img src={youtubeThumbnail(hinoVideoId)} alt="" loading="lazy" />
                  <span><Play size={20} fill="currentColor" /></span>
                </div>}
                <div className="academia-hino-summary">
                  <h2 className="academia-h2">{info?.hinoTitulo?.trim() || 'Hino da Academia'}</h2>
                  {info?.hinoAutoria && <p className="academia-hino-autoria">Autoria: {info.hinoAutoria}</p>}
                  {info?.hinoApresentacao
                    ? <p className="academia-hino-intro formatted-text"><FormattedText text={info.hinoApresentacao} /></p>
                    : hinoPrevia && <div className="academia-hino-preview">{paragraphs(hinoPrevia)}</div>}
                  <NavLink className="action-pill academia-hino-toggle" to="/academia/hino">
                    Conhecer o hino <ArrowUpRight size={15} aria-hidden="true" />
                  </NavLink>
                </div>
              </div>
        </section>
      </>}

      {/* ── Diretoria ── */}
      <section className="academia-diretoria">
        <div className="wrap">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Composição institucional</p>
              <h2>Diretoria <em>atual</em></h2>
            </div>
            {gestao && <p className="diretoria-gestao"><span>Gestão</span>{gestao.inicioAno} — {gestao.fimAno ?? 'atual'}</p>}
          </div>
          {diretoria.length === 0 && <p>Conselhos ainda não cadastrados.</p>}
          <div className="diretoria-conselhos">{conselhosComIntegrantes.map(conselho => {
            const integrantes = conselho.integrantes
            return <section className="diretoria-conselho" key={conselho.id} aria-labelledby={`conselho-${conselho.id}`}>
              <div className="diretoria-conselho-heading"><h3 id={`conselho-${conselho.id}`}>{conselho.nome}</h3><span>{integrantes.length} integrante{integrantes.length !== 1 ? 's' : ''}</span></div>
              <div className="diretoria-grid">{integrantes.map((d, index) => (
                <article className="diretoria-card" key={`${d.cargo}-${d.nome}`}>
                  <div className="diretoria-card-top">{d.cargo ? <p className="meta">{d.cargo}</p> : <span className="diretoria-sem-cargo">Integrante</span>}<span>{String(index + 1).padStart(2, '0')}</span></div>
                  <h3>{d.nome}</h3>
                  <p className="diretoria-posse">Desde {d.posse}</p>
                </article>
              ))}</div>
            </section>
          })}</div>
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
