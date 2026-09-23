export default function LoadState({ loading, error, retry }: { loading: boolean; error: string | null; retry: () => void }) {
  if (loading) return <span className="visually-hidden" role="status">Carregando conteúdo…</span>
  if (error) return <div className="load-state load-state-error wrap" role="alert"><p>{error}</p><button type="button" className="filtro-btn" onClick={retry}>Tentar novamente</button></div>
  return null
}
