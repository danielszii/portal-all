import GalleryModal from '@/components/GalleryModal'
import { useResource } from '@/hooks/useResource'
import LoadState from '@/components/LoadState'
import { useState, useCallback } from 'react'
import { NavLink } from 'react-router'
import { ArrowUpRight } from 'lucide-react'
import { fetchEventos, fetchGaleria } from '@/services/api'

import { EVENTO_TIPO_COR as tipoColor } from '@/constants'
import { formatData, formatMes, formatDia } from '@/utils/formatters'

export default function Agenda() {
  const [galeriaModal, setGaleriaModal] = useState<number | null>(null)
  const load = useCallback(async (signal: AbortSignal) => {
    const [eventos, fotos] = await Promise.all([fetchEventos(undefined, signal), fetchGaleria(signal)])
    return { eventos, fotos }
  }, [])
  const state = useResource(load, { eventos: [], fotos: [] })
  if (state.loading || state.error) return <main><LoadState {...state} /></main>
  const eventosList = state.data.eventos
  const fotos = state.data.fotos

  const proximos = eventosList.filter(e => !e.passado)
  const passados = eventosList.filter(e => e.passado).sort((a, b) => b.data.localeCompare(a.data))

  return (
    <main>
      <section className="page-hero wrap">
        <h1 className="page-title">Agenda <em>& Eventos</em></h1>
        <p className="page-lede">
          Sessões solenes, posses, palestras e lançamentos de livros da Academia
          Limoeirense de Letras. Todos os eventos são abertos ao público.
        </p>
      </section>

      {eventosList.length === 0 && <p className="wrap" role="status">Nenhum evento encontrado.</p>}
      {/* Próximos eventos */}
      {proximos.length > 0 && (
        <section className="agenda-section wrap">
          <div className="agenda-section-header">
            <h2>Próximos <em>eventos</em></h2>
          </div>
          <div className="agenda-list">
            {proximos.map(ev => (
              <article className="agenda-card" key={ev.id}>
                <div className="agenda-date">
                  <span className="agenda-mes">{formatMes(ev.data)}</span>
                  <span className="agenda-dia">{formatDia(ev.data)}</span>
                </div>
                <div className="agenda-info">
                  <div className="agenda-tipo-wrap">
                    <span className={`agenda-tipo ${tipoColor[ev.tipo] ?? 'navy'}`}>{ev.tipo}</span>
                  </div>
                  <h2 className="agenda-titulo">{ev.titulo}</h2>
                  <p className="agenda-meta">{formatData(ev.data)} · {ev.hora}</p>
                  <p className="agenda-local">{ev.local}</p>
                  <p className="agenda-desc">{ev.descricao}</p>
                </div>
                {ev.foto && (
                  <div className="agenda-thumb">
                    <img src={ev.foto} alt={ev.titulo} />
                  </div>
                )}
              </article>
            ))}
          </div>
        </section>
      )}

      {/* Eventos passados */}
      {passados.length > 0 && (
        <section className="agenda-section agenda-passados wrap">
          <div className="agenda-section-header">
            <h2>Eventos <em>anteriores</em></h2>
          </div>
          <div className="agenda-list agenda-list-past">
            {passados.map(ev => (
              <article className="agenda-card agenda-card-past" key={ev.id}>
                <div className="agenda-date agenda-date-past">
                  <span className="agenda-mes">{formatMes(ev.data)}</span>
                  <span className="agenda-dia">{formatDia(ev.data)}</span>
                  <span className="agenda-ano">{new Date(ev.data + 'T00:00:00').getFullYear()}</span>
                </div>
                <div className="agenda-info">
                  <span className={`agenda-tipo agenda-tipo-past ${tipoColor[ev.tipo] ?? 'navy'}`}>{ev.tipo}</span>
                  <h3 className="agenda-titulo-past">{ev.titulo}</h3>
                  <p className="agenda-meta">{formatData(ev.data)} · {ev.hora} · {ev.local}</p>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {/* Galeria de fotos — RF09 */}
      <section className="galeria-section">
        <div className="wrap">
          <div className="section-heading">
            <div>
              <h2>Registros <em>de eventos</em></h2>
            </div>
          </div>
          <div className="galeria-grid">
            {fotos.map((foto, i) => (
              <button
                key={i}
                className="galeria-item"
                onClick={() => setGaleriaModal(i)}
                aria-label={`Ampliar: ${foto.legenda}`}
              >
                <img src={foto.src} alt={foto.legenda} />
                <span className="galeria-legenda">{foto.legenda}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {galeriaModal !== null && <GalleryModal fotos={fotos} index={galeriaModal} onIndex={setGaleriaModal} onClose={() => setGaleriaModal(null)} />}

      {/* CTA Contato */}
      <section className="agenda-cta wrap">
        <div className="agenda-cta-inner">
          <h2>Quer participar<br /><em>de nossos eventos?</em></h2>
          <div className="agenda-cta-copy">
            <p>Todos os eventos da Academia são abertos ao público e de entrada franca. Para informações sobre datas e programação, entre em contato com nossa secretaria.</p>
            <NavLink className="text-link" to="/contato">
              Fale com a secretaria <ArrowUpRight size={15} />
            </NavLink>
          </div>
        </div>
      </section>
    </main>
  )
}
