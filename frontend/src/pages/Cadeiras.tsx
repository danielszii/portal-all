import { useResource } from '@/hooks/useResource'
import LoadState from '@/components/LoadState'
import { useState, useCallback } from 'react'
import { ArrowUpRight } from 'lucide-react'
import { NavLink } from 'react-router'
import { fetchCadeiras } from '@/services/api'
import type { Cadeira } from '@/types'
import MemberPhotoFrame from '@/components/MemberPhotoFrame'

const filtros = ['Todos', 'Titular em exercício', 'In memoriam', 'Vaga']

export default function Cadeiras() {
  const [filtro, setFiltro] = useState('Todos')
  const load = useCallback((signal: AbortSignal) => fetchCadeiras(undefined, undefined, signal), [])
  const state = useResource<Cadeira[]>(load, [])
  const lista = filtro === 'Todos' ? state.data : state.data.filter(c => c.status === filtro)
  const totalCount = state.data.length
  const loading = state.loading
  if (state.loading || state.error) return <main><LoadState {...state} /></main>

  return (
    <main>
      <section className="page-hero wrap">
        <p className="eyebrow">Catálogo histórico</p>
        <h1 className="page-title">Quadro de <em>cadeiras</em></h1>
        <p className="page-lede">
          A Academia Limoeirense de Letras possui 40 cadeiras acadêmicas, cada uma com um patrono
          da literatura nacional ou regional, um fundador e um titular em exercício.
        </p>
      </section>

      {/* Filtros */}
      <div className="cadeiras-filtros wrap">
        {filtros.map(f => (
          <button
            key={f}
            className={`filtro-btn ${filtro === f ? 'active' : ''}`}
            onClick={() => setFiltro(f)}
          >
            {f}
          </button>
        ))}
        <span className="filtro-count">{lista.length} cadeira{lista.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Grade */}
      <section className="chairs-section" style={{ background: 'var(--linen)', borderTop: '1px solid var(--line)' }}>
        <div className="wrap">
          <div className="chair-grid" style={{ paddingBlock: '60px' }}>
            {lista.length === 0 && <p role="status">Nenhuma cadeira encontrada para este filtro.</p>}
            {lista.map((chair) => (
              <NavLink
                to={`/cadeiras/${chair.number.toLowerCase()}`}
                key={chair.number}
                className="chair"
                aria-label={`Cadeira ${chair.number} — ${chair.patron}`}
              >
                <MemberPhotoFrame
                  src={chair.image}
                  alt={`Retrato de ${chair.holder}`}
                  status={chair.status}
                  chairNumber={chair.number}
                  size="md"
                />
                <div className="chair-meta">
                  <span className="chair-number">Cadeira · {chair.number}</span>
                  <h3>{chair.holder}</h3>
                  <p className="chair-patron">{chair.patron}</p>
                  <span className={
                    chair.status === 'In memoriam' || chair.status === 'Vaga'
                      ? 'status memorial' : 'status'
                  }>{chair.status}</span>
                </div>
              </NavLink>
            ))}
          </div>
          <div style={{ borderTop: '1px solid var(--line)', paddingTop: '32px', paddingBottom: '80px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <p style={{ margin: 0, color: 'var(--muted)', font: '9px "Space Mono", monospace', letterSpacing: '.1em', textTransform: 'uppercase' }}>
              Exibindo {lista.length} de {totalCount || lista.length} cadeiras {loading ? '(atualizando...)' : ''}
            </p>
            <NavLink className="text-link" to="/contato">Indicar membro <ArrowUpRight size={15} /></NavLink>
          </div>
        </div>
      </section>
    </main>
  )
}
