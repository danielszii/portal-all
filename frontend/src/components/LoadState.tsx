import { LoaderCircle, TriangleAlert } from 'lucide-react'

export default function LoadState({ loading, error, retry }: { loading: boolean; error: string | null; retry: () => void }) {
  if (loading) return (
    <div className="load-state load-state-loading" role="status" aria-live="polite">
      <LoaderCircle className="load-state-spinner" size={24} aria-hidden="true" />
      <span>Carregando conteúdo…</span>
    </div>
  )
  if (error) return (
    <div className="load-state load-state-error wrap" role="alert">
      <TriangleAlert size={22} aria-hidden="true" />
      <div><strong>Não foi possível carregar</strong><p>{error}</p></div>
      <button type="button" className="action-pill" onClick={retry}>Tentar novamente</button>
    </div>
  )
  return null
}
