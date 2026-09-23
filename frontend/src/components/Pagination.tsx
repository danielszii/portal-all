import { ChevronLeft, ChevronRight } from 'lucide-react'

export function pageFromUrl(value: string | null) {
  const page = Number(value)
  return value && /^[1-9]\d*$/.test(value) && Number.isSafeInteger(page) && page <= 2147483647 ? page : 1
}

export default function Pagination({ page, totalPages, onChange }: {
  page: number; totalPages: number; onChange: (page: number) => void
}) {
  if (totalPages <= 1) return null
  const currentPage = Math.min(Math.max(page, 1), totalPages)

  const candidates = totalPages <= 5
    ? Array.from({ length: totalPages }, (_, index) => index + 1)
    : [1, currentPage - 1, currentPage, currentPage + 1, totalPages].filter(value => value >= 1 && value <= totalPages)
  const pages = [...new Set(candidates)].sort((a, b) => a - b)

  return (
    <nav aria-label="Paginação" className="catalog-pagination">
      <button className="pagination-arrow" disabled={currentPage <= 1} onClick={() => onChange(currentPage - 1)} aria-label="Página anterior">
        <ChevronLeft size={16} />
      </button>

      <div className="pagination-pages">
        {pages.map((pageNumber, index) => (
          <span className="pagination-item" key={pageNumber}>
            {index > 0 && pageNumber - pages[index - 1] > 1 && <span className="pagination-ellipsis">…</span>}
            <button
              className={pageNumber === currentPage ? 'pagination-number active' : 'pagination-number'}
              aria-current={pageNumber === currentPage ? 'page' : undefined}
              aria-label={`Página ${pageNumber}`}
              onClick={() => onChange(pageNumber)}
            >
              {pageNumber}
            </button>
          </span>
        ))}
      </div>

      <button className="pagination-arrow" disabled={currentPage >= totalPages} onClick={() => onChange(currentPage + 1)} aria-label="Próxima página">
        <ChevronRight size={16} />
      </button>
      <span className="visually-hidden" aria-live="polite">Página {currentPage} de {totalPages}</span>
    </nav>
  )
}
