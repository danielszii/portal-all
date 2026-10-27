import { useResource } from '@/hooks/useResource'
import LoadState from '@/components/LoadState'
import { useState, useCallback, useEffect } from 'react'
import { NavLink } from 'react-router'
import { fetchCadeiras } from '@/services/api'
import type { Cadeira } from '@/types'
import MemberPhotoFrame from '@/components/MemberPhotoFrame'
import Pagination from '@/components/Pagination'
import { formatNumeroCadeira } from '@/utils/formatters'
import PortalText from '@/components/PortalText'

type CadeiraFiltro = 'titulares' | 'honorarios' | 'memoriam'

const filtros: { id: CadeiraFiltro; label: string }[] = [
  { id: 'titulares', label: 'Titulares' },
  { id: 'honorarios', label: 'Honorários' },
  { id: 'memoriam', label: 'In Memoriam' },
]

function categoriaCadeira(chair: Cadeira): CadeiraFiltro | null {
  if (chair.category === 'Honorário') return 'honorarios'
  if (chair.category === 'In Memoriam') return 'memoriam'
  if (chair.category === 'Titular') return 'titulares'
  const status = chair.status.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()
  if (status === 'in memoriam') return 'memoriam'
  if (status.includes('honorari') || status.includes('emerit')) return 'honorarios'
  if (status.includes('titular')) return 'titulares'
  return null
}

export default function Cadeiras() {
  const [page, setPage] = useState(1)
  const [filtro, setFiltro] = useState<CadeiraFiltro>('titulares')
  const load = useCallback((signal: AbortSignal) => fetchCadeiras(undefined, undefined, signal), [])
  const state = useResource<Cadeira[]>(load, [])
  const lista = state.data
  const cadeirasPorFiltro = lista.filter(chair => categoriaCadeira(chair) === filtro)
  const pageSize = 12
  const totalPages = Math.max(1, Math.ceil(cadeirasPorFiltro.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const cadeirasVisiveis = cadeirasPorFiltro.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  useEffect(() => {
    setPage(1)
  }, [filtro])

  if (state.loading || state.error) return <main><LoadState {...state} /></main>

  return (
    <main>
      <section className="page-hero wrap">
        <h1 className="page-title">Cadeiras</h1>
        <PortalText className="page-lede" field="cadeirasIntroducao" />
      </section>

      {/* Grade */}
      <section className="chairs-section chairs-catalog-section" data-pagination-start>
        <div className="wrap">
          <div className="chair-filters" role="tablist" aria-label="Filtrar cadeiras por categoria">
            {filtros.map(({ id, label }) => {
              const quantidade = lista.filter(chair => categoriaCadeira(chair) === id).length
              return (
                <button
                  type="button"
                  role="tab"
                  key={id}
                  aria-selected={filtro === id}
                  className={filtro === id ? 'chair-filter active' : 'chair-filter'}
                  onClick={() => setFiltro(id)}
                >
                  {label} <span aria-label={`${quantidade} cadeiras`}>({quantidade})</span>
                </button>
              )
            })}
          </div>
          <div className="chair-grid chair-grid-catalog">
            {cadeirasPorFiltro.length === 0 && <p role="status">Nenhuma cadeira encontrada para este filtro.</p>}
            {cadeirasVisiveis.map((chair) => (
              <NavLink
                to={`/cadeiras/${chair.number.toLowerCase()}`}
                key={chair.number}
                className="chair"
                aria-label={`Cadeira ${formatNumeroCadeira(chair.number)} — ${chair.patron}`}
              >
                <MemberPhotoFrame
                  src={chair.image}
                  alt={`Retrato de ${chair.holder}`}
                  status={chair.status}
                  chairNumber={chair.number}
                  size="md"
                  photoVariant="institutional-demo"
                />
                <div className="chair-meta">
                  <span className="chair-number">Cadeira · {formatNumeroCadeira(chair.number)}</span>
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
