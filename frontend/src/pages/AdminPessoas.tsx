import { useCallback, useState } from 'react'
import { ArrowLeft, Search, Trash2 } from 'lucide-react'
import { NavLink } from 'react-router'
import Pagination from '@/components/Pagination'
import { useAdminConfirm } from '@/components/admin/AdminConfirmDialog'
import { useAuth } from '@/contexts/AuthContext'
import { useResource } from '@/hooks/useResource'
import { AdminApiError, deleteAdminPerson, loadAdminPeople, type AdminPage, type PersonRecord, type PersonResource } from '@/services/admin'

const empty: AdminPage<PersonRecord> = { items: [], total: 0, page: 1, pageSize: 20, totalPages: 1 }

export default function AdminPessoas() {
  const { csrfToken, refresh, can } = useAuth()
  const [resource, setResource] = useState<PersonResource>('academicos')
  const [query, setQuery] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [busyId, setBusyId] = useState('')
  const [feedback, setFeedback] = useState('')
  const [error, setError] = useState('')
  const confirmation = useAdminConfirm()
  const load = useCallback((signal: AbortSignal) => loadAdminPeople(resource, page, search, signal), [resource, page, search])
  const state = useResource(load, empty)
  const changeResource = (next: PersonResource) => { setResource(next); setPage(1); setQuery(''); setSearch(''); setError(''); setFeedback('') }

  const remove = async (person: PersonRecord) => {
    const role = resource === 'academicos' ? 'acadêmico' : 'patrono'
    if (!csrfToken || !can('registros:excluir')) return
    if (!await confirmation.confirm({ title: 'Excluir cadastro?', message: `${person.nome} será excluído definitivamente. A operação só será permitida se este ${role} não possuir nenhum vínculo histórico.`, confirmLabel: 'Excluir cadastro', tone: 'danger' })) return
    setBusyId(person.id); setError(''); setFeedback('')
    try {
      await deleteAdminPerson(resource, person.id, csrfToken)
      setFeedback('Cadastro excluído com sucesso.'); state.retry()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível excluir o cadastro.')
      if (err instanceof AdminApiError && err.status === 401) void refresh()
    } finally { setBusyId('') }
  }

  return <><main className="admin-page admin-workspace-page">
    <div className="wrap admin-workspace">
      <header className="admin-workspace-header">
        <div><h1>Cadastros sem <em>vínculo</em></h1><p>Remova somente pessoas cadastradas por engano e que não fazem parte do histórico da Academia.</p></div>
        <div className="admin-header-actions"><NavLink className="admin-secondary-action" to="/admin/membros"><ArrowLeft size={15} /> Voltar aos membros</NavLink></div>
      </header>
      <p className="admin-context-note">Pessoas ligadas a cadeiras, obras ou sucessões ficam protegidas e não podem ser excluídas.</p>
      {feedback && <p className="admin-feedback" role="status">{feedback}</p>}
      {error && <p className="admin-state admin-state-error" role="alert">{error}</p>}
      <section className="admin-management" aria-label="Cadastros avulsos">
        <div className="admin-person-tabs" role="tablist" aria-label="Tipo de pessoa">
          <button type="button" role="tab" aria-selected={resource === 'academicos'} className={resource === 'academicos' ? 'is-active' : ''} onClick={() => changeResource('academicos')}>Acadêmicos</button>
          <button type="button" role="tab" aria-selected={resource === 'patronos'} className={resource === 'patronos' ? 'is-active' : ''} onClick={() => changeResource('patronos')}>Patronos</button>
        </div>
        <div className="admin-management-toolbar">
          <form className="admin-search" role="search" onSubmit={event => { event.preventDefault(); setPage(1); setSearch(query.trim()) }}>
            <Search size={15} aria-hidden="true" /><input aria-label="Buscar pessoa" value={query} maxLength={200} onChange={event => setQuery(event.target.value)} placeholder="Buscar por nome…" /><button className="filtro-btn" type="submit">Buscar</button>
          </form>
          <span>{state.data.total} cadastro{state.data.total !== 1 ? 's' : ''}</span>
        </div>
        {state.loading && <p className="admin-state" role="status">Carregando cadastros…</p>}
        {state.error && <div className="admin-state admin-state-error" role="alert"><p>{state.error}</p><button type="button" className="filtro-btn" onClick={state.retry}>Tentar novamente</button></div>}
        {!state.loading && !state.error && state.data.items.length === 0 && <p className="admin-state">Nenhum cadastro encontrado.</p>}
        {!state.loading && !state.error && <div className="admin-record-list">{state.data.items.map(person => <article className="admin-record" key={person.id}>
          <div><h2>{person.nome}</h2><p>{person.biografia || 'Sem biografia cadastrada.'}</p></div>
          <span>{resource === 'academicos' ? 'Acadêmico' : 'Patrono'}</span>
          {can('registros:excluir') && <div className="admin-record-actions"><button className="admin-delete-action" type="button" disabled={busyId === person.id} onClick={() => void remove(person)}><Trash2 size={14} /> {busyId === person.id ? 'Excluindo…' : 'Excluir'}</button></div>}
        </article>)}</div>}
        {!state.loading && !state.error && <Pagination page={state.data.page} totalPages={state.data.totalPages} onChange={setPage} />}
      </section>
    </div>
  </main>{confirmation.dialog}</>
}
