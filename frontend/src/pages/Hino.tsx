import { useState } from 'react'
import { ArrowLeft, Play } from 'lucide-react'
import { NavLink } from 'react-router'
import FormattedText from '@/components/FormattedText'
import LoadState from '@/components/LoadState'
import { useInstituicao } from '@/hooks/useInstituicao'
import { youtubeEmbed, youtubeThumbnail, youtubeVideoId } from '@/utils/youtube'

const paragraphs = (value: string | null | undefined) => value?.trim()
  ? value.split('\n\n').map((text, index) => <p className="formatted-text" key={index}><FormattedText text={text} /></p>)
  : null

export default function Hino() {
  const state = useInstituicao()
  const [playing, setPlaying] = useState(false)
  if (state.loading || state.error) return <main><LoadState {...state} /></main>

  const info = state.data.info
  const title = info?.hinoTitulo?.trim() || 'Hino da Academia'
  const videoId = youtubeVideoId(info?.hinoVideoUrl)
  const hasContent = Boolean(info?.hinoLetra?.trim() || info?.hinoApresentacao?.trim() || videoId)

  return <main className="hino-page">
    <section className="page-hero wrap hino-page-hero">
      <p className="eyebrow">Símbolos e tradições</p>
      <h1 className="page-title">Hino da <em>Academia</em></h1>
      {info?.hinoApresentacao
        ? <div className="page-lede">{paragraphs(info.hinoApresentacao)}</div>
        : <p className="page-lede">Palavras e música que celebram a memória, a cultura e a missão da Academia Limoeirense de Letras.</p>}
    </section>

    {!hasContent && <section className="wrap hino-empty">
      <NavLink className="back-link" to="/academia"><ArrowLeft size={15} aria-hidden="true" /> Voltar à Academia</NavLink>
      <p>O hino institucional ainda não foi disponibilizado.</p>
    </section>}

    {hasContent && <>
      <section className="academia-section wrap hino-feature-section" aria-label="Vídeo e informações do hino">
        <NavLink className="back-link hino-back" to="/academia"><ArrowLeft size={15} aria-hidden="true" /> Voltar à Academia</NavLink>
        <div className="academia-grid hino-feature">
          <div className="academia-grid-label">
            <span className="eyebrow">Hino institucional</span>
          </div>
          <div className="academia-grid-body hino-feature-main">
            <div className="hino-feature-heading">
              <h2 className="academia-h2">{title}</h2>
              {info?.hinoAutoria && <p className="hino-author">Autoria: {info.hinoAutoria}</p>}
            </div>
            <div className="hino-video-shell">
              {videoId ? playing
                ? <iframe
                    src={youtubeEmbed(videoId)}
                    title={`Vídeo: ${title}`}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    referrerPolicy="strict-origin-when-cross-origin"
                    allowFullScreen
                  />
                : <button type="button" className="hino-video-poster" onClick={() => setPlaying(true)} aria-label={`Reproduzir vídeo: ${title}`}>
                    <img src={youtubeThumbnail(videoId)} alt="" loading="lazy" />
                    <span className="hino-play"><Play size={25} fill="currentColor" aria-hidden="true" /></span>
                    <span>Assistir ao hino</span>
                  </button>
                : <div className="hino-video-unavailable"><Play size={30} aria-hidden="true" /><p>Vídeo em preparação</p></div>}
            </div>
        </div>
        </div>
      </section>

      <div className="academia-divider wrap" />

      <section className="academia-section wrap hino-body">
        <div className="academia-grid hino-body-grid">
          <div className="academia-grid-label">
            <span className="eyebrow">Letra completa</span>
          </div>
          <div className="academia-grid-body hino-body-content">
            <article className="hino-lyrics" aria-labelledby="hino-lyrics-title">
              <h2 className="academia-h2" id="hino-lyrics-title">Palavras do <em>hino</em></h2>
              {paragraphs(info?.hinoLetra) ?? <p>Letra ainda não disponibilizada.</p>}
            </article>
            <aside className="hino-credits" aria-labelledby="hino-credits-title">
              <p className="eyebrow">Ficha da gravação</p>
              <h2 id="hino-credits-title">Créditos</h2>
              {paragraphs(info?.hinoCreditos) ?? <p>Créditos ainda não informados.</p>}
            </aside>
          </div>
        </div>
      </section>
    </>}
  </main>
}
