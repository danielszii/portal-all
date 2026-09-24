import { useResource } from '@/hooks/useResource'
import LoadState from '@/components/LoadState'
import { useState, useCallback } from 'react'
import { NavLink } from 'react-router'
import { fetchCadeiras } from '@/services/api'
import type { Cadeira } from '@/types'
import MemberPhotoFrame from '@/components/MemberPhotoFrame'
import Pagination from '@/components/Pagination'

export default function Cadeiras() {
  const [page, setPage] = useState(1)
  const load = useCallback((signal: AbortSignal) => fetchCadeiras(undefined, undefined, signal), [])
  const state = useResource<Cadeira[]>(load, [])
  const lista = state.data
  const pageSize = 12
  const totalPages = Math.max(1, Math.ceil(lista.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const cadeirasVisiveis = lista.slice((currentPage - 1) * pageSize, currentPage * pageSize)
  if (state.loading || state.error) return <main><LoadState {...state} /></main>

  return (
    <main>
      <section className="page-hero wrap">
        <h1 className="page-title">Quadro de <em>cadeiras</em></h1>
        <p className="page-lede">
          A Academia Limoeirense de Letras possui 40 cadeiras acadêmicas, cada uma com um patrono
          da literatura nacional ou regional, um fundador e um titular em exercício.
        </p>
      </section>

      {/* Grade */}
      <section className="chairs-section chairs-catalog-section">
        <div className="wrap">
          <div className="chair-grid chair-grid-catalog">
            {lista.length === 0 && <p role="status">Nenhuma cadeira encontrada para este filtro.</p>}
            {cadeirasVisiveis.map((chair) => (
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
                  variant="ornate"
                  photoVariant={chair.image ? 'source' : 'institutional-demo'}
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
          <Pagination page={currentPage} totalPages={totalPages} onChange={setPage} />
        </div>
      </section>
    </main>
  )
}
