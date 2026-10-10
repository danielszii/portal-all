import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useRef } from 'react'

export function pageFromUrl(value: string | null) {
  const page = Number(value)
  return value && /^[1-9]\d*$/.test(value) && Number.isSafeInteger(page) && page <= 2147483647 ? page : 1
}

export default function Pagination({ page, totalPages, onChange }: {
  page: number; totalPages: number; onChange: (page: number) => void
}) {
  const navigationRef = useRef<HTMLElement>(null)
  if (totalPages <= 1) return null
  const currentPage = Math.min(Math.max(page, 1), totalPages)

  const changePage = (nextPage: number) => {
    if (nextPage === currentPage) return
    const target = navigationRef.current?.closest<HTMLElement>('[data-pagination-start], section')
    const targetTop = target ? target.getBoundingClientRect().top + window.scrollY : 0
    onChange(nextPage)
    window.requestAnimationFrame(() => window.requestAnimationFrame(() => {
      const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      window.scrollTo({ top: targetTop, left: 0, behavior: reduceMotion ? 'auto' : 'smooth' })
    }))
  }

  const candidates = totalPages <= 5
    ? Array.from({ length: totalPages }, (_, index) => index + 1)
    : [1, currentPage - 1, currentPage, currentPage + 1, totalPages].filter(value => value >= 1 && value <= totalPages)
  const pages = [...new Set(candidates)].sort((a, b) => a - b)

  return (
    <nav ref={navigationRef} aria-label="Paginação" className="catalog-pagination">
      <button type="button" className="pagination-arrow" disabled={currentPage <= 1} onClick={() => changePage(currentPage - 1)} aria-label="Página anterior">
        <ChevronLeft size={16} aria-hidden="true" />
      </button>

      <div className="pagination-pages">
        {pages.map((pageNumber, index) => (
          <span className="pagination-item" key={pageNumber}>
            {index > 0 && pageNumber - pages[index - 1] > 1 && <span className="pagination-ellipsis" aria-hidden="true">…</span>}
            <button
              type="button"
              className={pageNumber === currentPage ? 'pagination-number active' : 'pagination-number'}
              aria-current={pageNumber === currentPage ? 'page' : undefined}
              aria-label={`Página ${pageNumber}`}
              onClick={() => changePage(pageNumber)}
            >
              {pageNumber}
            </button>
          </span>
        ))}
      </div>

      <button type="button" className="pagination-arrow" disabled={currentPage >= totalPages} onClick={() => changePage(currentPage + 1)} aria-label="Próxima página">
        <ChevronRight size={16} aria-hidden="true" />
      </button>
      <span className="visually-hidden" aria-live="polite">Página {currentPage} de {totalPages}</span>
    </nav>
  )
}
