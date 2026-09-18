export default function LoadState({ loading, error, retry }: { loading: boolean; error: string | null; retry: () => void }) {
  if (loading) return <div className="load-state wrap" role="status"><span className="load-state-indicator" />Carregando conteúdo…</div>
  if (error) return <div className="load-state load-state-error wrap" role="alert"><p>{error}</p><button type="button" className="filtro-btn" onClick={retry}>Tentar novamente</button></div>
  return null
}
