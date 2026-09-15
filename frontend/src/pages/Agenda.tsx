import { useState, useEffect } from 'react'
import { NavLink } from 'react-router'
import { ArrowUpRight, X } from 'lucide-react'
import { eventos as fallbackEventos, galeriaFotos as fallbackGaleria, type Evento, type GaleriaFoto } from '@/data/agenda'
import { fetchEventos, fetchGaleria } from '@/services/api'

const tipos = ['Todos', 'Sessão Solene', 'Posse', 'Palestra', 'Lançamento', 'Sarau']

const tipoColor: Record<string, string> = {
  'Sessão Solene': 'navy',
  'Posse': 'bronze',
  'Palestra': 'ink',
  'Lançamento': 'ochre',
  'Sarau': 'green',
  'Reunião': 'ink',
}

function formatData(iso: string) {
  const d = new Date(iso + 'T00:00:00')
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
}

function formatMes(iso: string) {
  const d = new Date(iso + 'T00:00:00')
  return d.toLocaleDateString('pt-BR', { month: 'short' }).toUpperCase().replace('.', '')
}

function formatDia(iso: string) {
  return new Date(iso + 'T00:00:00').getDate().toString().padStart(2, '0')
}

export default function Agenda() {
  const [filtro, setFiltro] = useState('Todos')
  const [galeriaModal, setGaleriaModal] = useState<number | null>(null)
  const [eventosList, setEventosList] = useState<Evento[]>(fallbackEventos)
  const [fotos, setFotos] = useState<GaleriaFoto[]>(fallbackGaleria)

  useEffect(() => {
    let active = true
    fetchEventos(filtro).then(data => {
      if (active && data) setEventosList(data)
    })
    return () => {
      active = false
    }
  }, [filtro])

  useEffect(() => {
    let active = true
    fetchGaleria().then(data => {
      if (active && data) setFotos(data)
    })
    return () => {
      active = false
    }
  }, [])

  const proximos = eventosList.filter(e => !e.passado)
  const passados = eventosList.filter(e => e.passado)

  const filtrados = (lista: typeof eventosList) =>
    filtro === 'Todos' ? lista : lista.filter(e => e.tipo === filtro)

  return (
    <main>
      <section className="page-hero wrap">
        <p className="eyebrow">Programação cultural</p>
        <h1 className="page-title">Agenda <em>& Eventos</em></h1>
        <p className="page-lede">
          Sessões solenes, posses, palestras e lançamentos de livros da Academia
          Limoeirense de Letras. Todos os eventos são abertos ao público.
        </p>
      </section>

      {/* Filtros */}
      <div className="cadeiras-filtros wrap">
        {tipos.map(t => (
          <button
            key={t}
            className={`filtro-btn ${filtro === t ? 'active' : ''}`}
            onClick={() => setFiltro(t)}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Próximos eventos */}
      {filtrados(proximos).length > 0 && (
        <section className="agenda-section wrap">
          <div className="agenda-section-header">
            <p className="eyebrow">Próximos eventos</p>
          </div>
          <div className="agenda-list">
            {filtrados(proximos).map(ev => (
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
      {filtrados(passados).length > 0 && (
        <section className="agenda-section agenda-passados wrap">
          <div className="agenda-section-header">
            <p className="eyebrow">Eventos anteriores</p>
          </div>
          <div className="agenda-list agenda-list-past">
            {filtrados(passados).map(ev => (
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
              <p className="eyebrow">Registros fotográficos</p>
              <h2>Galeria <em>de eventos</em></h2>
            </div>
            <p className="heading-note">Solenidades, encontros culturais<br />e momentos da vida acadêmica.</p>
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

      {/* Lightbox */}
      {galeriaModal !== null && fotos[galeriaModal] && (
        <div className="lightbox" role="dialog" aria-modal="true" onClick={() => setGaleriaModal(null)}>
          <button className="lightbox-close" onClick={() => setGaleriaModal(null)} aria-label="Fechar">
            <X size={20} />
          </button>
          <div className="lightbox-inner" onClick={e => e.stopPropagation()}>
            <img src={fotos[galeriaModal].src.replace('w=800', 'w=1400')} alt={fotos[galeriaModal].legenda} />
            <p className="lightbox-legenda">{fotos[galeriaModal].legenda}</p>
            <div className="lightbox-nav">
              <button
                onClick={() => setGaleriaModal(g => g !== null && g > 0 ? g - 1 : fotos.length - 1)}
                aria-label="Anterior"
              >← Anterior</button>
              <span>{galeriaModal + 1} / {fotos.length}</span>
              <button
                onClick={() => setGaleriaModal(g => g !== null && g < fotos.length - 1 ? g + 1 : 0)}
                aria-label="Próxima"
              >Próxima →</button>
            </div>
          </div>
        </div>
      )}

      {/* CTA Contato */}
      <section className="agenda-cta wrap">
        <div className="section-rule"><span>—</span><span>Participação</span><span>—</span></div>
        <div className="agenda-cta-inner">
          <h2>Quer participar<br /><em>de nossos eventos?</em></h2>
          <p>Todos os eventos da Academia são abertos ao público e de entrada franca. Para informações sobre datas e programação, entre em contato com nossa secretaria.</p>
          <NavLink className="text-link" to="/contato">
            Fale com a secretaria <ArrowUpRight size={15} />
          </NavLink>
        </div>
      </section>
    </main>
  )
}
