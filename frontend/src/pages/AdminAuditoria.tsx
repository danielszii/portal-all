import { useCallback, useState } from 'react'
import { ArrowLeft, CalendarDays, Filter, FilterX, UserRound } from 'lucide-react'
import { NavLink } from 'react-router'
import Pagination from '@/components/Pagination'
import { useResource } from '@/hooks/useResource'
import { loadAdminAudit, type AdminPage, type AuditRecord, type AuditFilters } from '@/services/admin'

const empty: AdminPage<AuditRecord> = { items: [], total: 0, page: 1, pageSize: 20, totalPages: 1 }
const initialFilters: AuditFilters = { acao: '', recurso: '', registroId: '', inicio: '', fim: '' }
const actionLabels: Record<string, string> = {
  CRIAR: 'Criação', EDITAR: 'Edição', PUBLICAR: 'Publicação', ARQUIVAR: 'Arquivamento', EXCLUIR: 'Exclusão',
  TROCAR_TITULAR: 'Troca de titular', ENCERRAR_OCUPACAO: 'Encerramento de ocupação', ENVIAR_ARQUIVO: 'Envio de arquivo', LOGIN: 'Login', LOGOUT: 'Logout',
}
const resourceLabels: Record<string, string> = {
  NOTICIA: 'Notícia', ACERVO: 'Acervo', EVENTO: 'Evento', CADEIRA: 'Cadeira', ACADEMICO: 'Acadêmico',
  PATRONO: 'Patrono', GALERIA: 'Galeria', UPLOAD: 'Upload', SESSAO: 'Sessão',
  INSTITUICAO: 'Instituição', GESTAO: 'Gestão', MANDATO: 'Mandato', ADMINISTRADOR: 'Conta administrativa',
}
const detailLabels: Record<string, string> = {
  camposAlterados: 'Campos alterados', statusAnterior: 'Status anterior', statusAtual: 'Status atual',
  numero: 'Cadeira', url: 'Arquivo', tipo: 'Tipo', tamanho: 'Tamanho',
  perfisAnteriores: 'Perfis anteriores', perfisAtuais: 'Perfis atuais', ativoAnterior: 'Ativa antes', ativoAtual: 'Ativa agora',
}

function detailValue(value: unknown) {
  if (value === null || value === undefined || value === '') return '—'
  if (Array.isArray(value)) return value.length ? value.join(', ') : 'Nenhum'
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

export default function AdminAuditoria() {
  const [draft, setDraft] = useState(initialFilters)
  const [filters, setFilters] = useState(initialFilters)
  const [page, setPage] = useState(1)
  const load = useCallback((signal: AbortSignal) => loadAdminAudit(page, filters, signal), [page, filters])
  const state = useResource(load, empty)
  const update = (name: keyof AuditFilters, value: string) => setDraft(current => ({ ...current, [name]: value }))
  const clear = () => { setDraft(initialFilters); setFilters(initialFilters); setPage(1) }

  return <main className="admin-page admin-workspace-page">
    <div className="wrap admin-workspace">
      <header className="admin-workspace-header">
        <div><h1>Histórico de <em>alterações</em></h1><p>Consulte as operações realizadas na área administrativa.</p></div>
        <div className="admin-header-actions"><NavLink className="admin-secondary-action" to="/admin"><ArrowLeft size={15} /> Voltar ao painel</NavLink></div>
      </header>
      <section className="admin-management admin-audit-management" aria-label="Histórico de alterações">
        <div className="admin-audit-filter-panel">
          <div className="admin-audit-filter-heading"><span><Filter size={16} /></span><div><h2>Filtrar histórico</h2><p>Combine os campos para localizar uma operação.</p></div></div>
          <form className="admin-audit-filters" onSubmit={event => { event.preventDefault(); setPage(1); setFilters(draft) }}>
            <label><span>Ação</span><select value={draft.acao} onChange={event => update('acao', event.target.value)}><option value="">Todas</option>{Object.entries(actionLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
            <label><span>Recurso</span><select value={draft.recurso} onChange={event => update('recurso', event.target.value)}><option value="">Todos</option>{Object.entries(resourceLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
            <label className="admin-audit-id-field"><span>ID do registro</span><input value={draft.registroId} maxLength={100} placeholder="Informe o identificador" onChange={event => update('registroId', event.target.value)} /></label>
            <label><span>Data inicial</span><input type="date" value={draft.inicio} onChange={event => update('inicio', event.target.value)} /></label>
            <label><span>Data final</span><input type="date" value={draft.fim} onChange={event => update('fim', event.target.value)} /></label>
            <div className="admin-audit-filter-actions"><button className="filtro-btn" type="submit">Aplicar filtros</button><button className="admin-filter-clear" type="button" onClick={clear}><FilterX size={14} /> Limpar</button></div>
          </form>
        </div>
        <div className="admin-audit-summary"><strong>{state.data.total} registro{state.data.total !== 1 ? 's' : ''}</strong><span>Histórico somente para consulta</span></div>
        {state.loading && <p className="admin-state" role="status">Carregando histórico…</p>}
        {state.error && <div className="admin-state admin-state-error" role="alert"><p>{state.error}</p><button type="button" className="filtro-btn" onClick={state.retry}>Tentar novamente</button></div>}
        {!state.loading && !state.error && state.data.items.length === 0 && <p className="admin-state">Nenhuma alteração encontrada.</p>}
        {!state.loading && !state.error && <div className="admin-audit-list">
          {state.data.items.map(item => <article className="admin-audit-record" key={item.id}>
            <header className="admin-audit-record-header">
              <div className="admin-audit-tags"><span className={`admin-audit-action action-${item.acao.toLowerCase()}`}>{actionLabels[item.acao] || item.acao}</span><span className="admin-audit-resource">{resourceLabels[item.recurso] || item.recurso}</span></div>
              <time dateTime={item.criadoEm}><CalendarDays size={14} /> {new Date(item.criadoEm).toLocaleString('pt-BR')}</time>
            </header>
            <div className="admin-audit-record-body">
              <h2>{item.resumo}</h2>
              <div className="admin-audit-meta">
                <span><UserRound size={14} /><span><small>Responsável</small>{item.administradorEmail}</span></span>
                <span><span><small>ID do registro</small>{item.registroId}</span></span>
              </div>
              {Object.keys(item.detalhes || {}).length > 0 && <details><summary>Ver detalhes da operação</summary><dl>{Object.entries(item.detalhes).map(([key, value]) => <div key={key}><dt>{detailLabels[key] || key}</dt><dd>{detailValue(value)}</dd></div>)}</dl></details>}
            </div>
          </article>)}
        </div>}
        {!state.loading && !state.error && <Pagination page={state.data.page} totalPages={state.data.totalPages} onChange={setPage} />}
      </section>
    </div>
  </main>
}
