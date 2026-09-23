export function pageFromUrl(value: string | null) {
  const page = Number(value)
  return value && /^[1-9]\d*$/.test(value) && Number.isSafeInteger(page) && page <= 2147483647 ? page : 1
}

export default function Pagination({ page, totalPages, onChange }: {
  page: number; totalPages: number; onChange: (page: number) => void
}) {
  if (totalPages <= 1) return null
  return <nav aria-label="Paginação" className="catalog-pagination">
    <button className="filtro-btn" disabled={page <= 1} onClick={() => onChange(page - 1)}>Anterior</button>
    <span aria-live="polite">Página {page} de {totalPages}</span>
    <button className="filtro-btn" disabled={page >= totalPages} onClick={() => onChange(page + 1)}>Próxima</button>
  </nav>
}
