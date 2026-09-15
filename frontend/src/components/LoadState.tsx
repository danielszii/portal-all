export default function LoadState({ loading, error, retry }: { loading: boolean; error: string | null; retry: () => void }) {
  if (loading) return <div className="wrap" role="status" style={{ paddingBlock: 32 }}>Carregando conteúdo…</div>
  if (error) return <div className="wrap" role="alert" style={{ paddingBlock: 32 }}><p>{error}</p><button type="button" className="filtro-btn" onClick={retry}>Tentar novamente</button></div>
  return null
}
