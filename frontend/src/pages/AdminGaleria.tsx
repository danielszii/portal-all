import { useCallback, useState } from 'react'
import { ImageIcon, Search, Trash2, X } from 'lucide-react'
import Pagination from '@/components/Pagination'
import { useAdminConfirm } from '@/components/admin/AdminConfirmDialog'
import { useAuth } from '@/contexts/AuthContext'
import { useResource } from '@/hooks/useResource'
import { AdminApiError, deleteGalleryRecord, loadAdminGallery, type AdminPage, type GalleryRecord } from '@/services/admin'
import AdminPageHeader from '@/components/admin/AdminPageHeader'

const empty: AdminPage<GalleryRecord> = { items: [], total: 0, page: 1, pageSize: 20, totalPages: 1 }

export default function AdminGaleria() {
  const { csrfToken, refresh, can } = useAuth()
  const [query, setQuery] = useState('')
  const [eventoId, setEventoId] = useState('')
  const [page, setPage] = useState(1)
  const [busyId, setBusyId] = useState('')
  const [feedback, setFeedback] = useState('')
  const [error, setError] = useState('')
  const confirmation = useAdminConfirm()
  const load = useCallback((signal: AbortSignal) => loadAdminGallery(page, eventoId, signal), [page, eventoId])
  const state = useResource(load, empty)

  const remove = async (item: GalleryRecord) => {
    if (!csrfToken || !can('registros:excluir')) return
    if (!await confirmation.confirm({ title: 'Remover foto da galeria?', message: `“${item.legenda}” deixará de aparecer na galeria. O arquivo e o evento serão preservados.`, confirmLabel: 'Remover foto', tone: 'danger' })) return
    setBusyId(item.id); setFeedback(''); setError('')
    try {
      await deleteGalleryRecord(item.id, csrfToken)
      setFeedback('Foto removida da galeria.'); state.retry()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível remover a foto.')
      if (err instanceof AdminApiError && err.status === 401) void refresh()
    } finally { setBusyId('') }
  }

  return <><main className="admin-page admin-workspace-page">
    <div className="wrap admin-workspace">
      <AdminPageHeader title="Gerenciar" emphasis="galeria" description="Consulte as imagens vinculadas aos eventos e remova referências que não devem aparecer na galeria pública." backTo="/admin/agenda" backLabel="Voltar à agenda" />
      <p className="admin-context-note"><ImageIcon size={17} /> Ao publicar um evento com imagem, a referência é criada automaticamente. Excluir aqui não apaga o arquivo nem altera o evento.</p>
      {feedback && <p className="admin-feedback" role="status">{feedback}</p>}
      {error && <p className="admin-state admin-state-error" role="alert">{error}</p>}
      <section className="admin-management" aria-label="Gerenciamento da galeria">
        <div className="admin-management-toolbar">
          <form className="admin-search" role="search" onSubmit={event => { event.preventDefault(); setPage(1); setEventoId(query.trim()) }}>
            <Search size={15} aria-hidden="true" />
            <input aria-label="Filtrar pelo ID do evento" value={query} maxLength={100} onChange={event => setQuery(event.target.value)} placeholder="Filtrar pelo ID do evento…" />
            <button className="filtro-btn" type="submit">Buscar</button>
            {eventoId && <button className="admin-search-reset" type="button" aria-label="Limpar filtro" title="Limpar filtro" onClick={() => { setQuery(''); setEventoId(''); setPage(1) }}><X size={14} aria-hidden="true" /></button>}
          </form>
          <span>{state.data.total} foto{state.data.total !== 1 ? 's' : ''}</span>
        </div>
        {state.loading && <p className="admin-state" role="status">Carregando galeria…</p>}
        {state.error && <div className="admin-state admin-state-error" role="alert"><p>{state.error}</p><button type="button" className="filtro-btn" onClick={state.retry}>Tentar novamente</button></div>}
        {!state.loading && !state.error && state.data.items.length === 0 && <p className="admin-state">Nenhuma foto encontrada.</p>}
        {!state.loading && !state.error && <div className="admin-gallery-grid">
          {state.data.items.map(item => <article className="admin-gallery-card" key={item.id}>
            <img src={item.src} alt={item.textoAlternativo || item.legenda} loading="lazy" />
            <div><span>{item.automatica ? 'Automática' : 'Manual'}</span><h2>{item.legenda}</h2><p>{item.eventoId ? `Evento: ${item.eventoId}` : 'Sem evento vinculado'}</p>{item.credito && <small>Crédito: {item.credito}</small>}</div>
            {can('registros:excluir') && <button className="admin-delete-action" type="button" disabled={busyId === item.id} onClick={() => void remove(item)}><Trash2 size={14} /> {busyId === item.id ? 'Removendo…' : 'Remover'}</button>}
          </article>)}
        </div>}
        {!state.loading && !state.error && <Pagination page={state.data.page} totalPages={state.data.totalPages} onChange={setPage} />}
      </section>
    </div>
  </main>{confirmation.dialog}</>
}
