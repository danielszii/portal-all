import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { ArrowLeft, Plus, Search, X } from 'lucide-react'
import { NavLink } from 'react-router'
import { useAuth } from '@/contexts/AuthContext'
import { useResource } from '@/hooks/useResource'
import { useDialog } from '@/hooks/useDialog'
import Pagination from '@/components/Pagination'
import { adminItem, adminRequest, loadAdminPage, loadAdminRecord, saveAdminForm, uploadAdminFile, AdminApiError,
  type AdminResource, type FormValues, type AdminListItem, type AdminPage, type AdminRecord } from '@/services/admin'

export type AdminField = {
  name: string; label: string; type?: 'text' | 'date' | 'datetime-local' | 'number' | 'textarea' | 'select' | 'file'
  options?: (string | { value: string; label: string })[]; required?: boolean; placeholder?: string; accept?: string
  publishedRequired?: boolean; urlField?: string; readOnlyOnEdit?: boolean; onlyCreate?: boolean; onlyEnd?: boolean
  min?: number; max?: number; maxLength?: number
}
type Props = {
  resource: AdminResource; title: string; emphasis: string; description: string; singular: string
  fields: AdminField[]; defaults?: FormValues; renderPreview?: (values: FormValues) => ReactNode
}
const empty: AdminPage<AdminRecord> = { items: [], page: 1, pageSize: 20, total: 0, totalPages: 1 }

export default function AdminResourcePage(props: Props) {
  const { resource, title, emphasis, description, singular } = props
  const { csrfToken, refresh } = useAuth()
  const [query, setQuery] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [editor, setEditor] = useState<{ id: string | null; values: FormValues } | null>(null)
  const [busy, setBusy] = useState(false)
  const [feedback, setFeedback] = useState('')
  const [error, setError] = useState('')
  const load = useCallback(async (signal: AbortSignal) => {
    try { return await loadAdminPage(resource, page, search, signal) }
    catch (err) { if (err instanceof AdminApiError && err.status === 401) void refresh(); throw err }
  }, [resource, page, search, refresh])
  const state = useResource(load, empty)
  const items = state.data.items.map(row => adminItem(resource, row))
  const handleError = (err: unknown) => {
    setError(err instanceof Error ? err.message : 'Não foi possível concluir a operação.')
    if (err instanceof AdminApiError && err.status === 401) void refresh()
  }
  const edit = async (item: AdminListItem) => {
    setBusy(true); setError(''); setFeedback('')
    try { setEditor({ id: item.id, values: adminItem(resource, await loadAdminRecord(resource, item.id)).values }) }
    catch (err) { handleError(err) }
    finally { setBusy(false) }
  }
  const remove = async (item: AdminListItem) => {
    if (!csrfToken || !window.confirm(`Excluir o evento “${item.title}” e suas referências na galeria? Esta ação não pode ser desfeita.`)) return
    setBusy(true); setError(''); setFeedback('')
    try {
      await adminRequest(`/agenda/${encodeURIComponent(item.id)}`, { method: 'DELETE', csrfToken })
      setFeedback('Evento excluído.'); state.retry()
    } catch (err) { handleError(err) }
    finally { setBusy(false) }
  }
  return <main className="admin-page admin-workspace-page">
    <div className="wrap admin-workspace">
      <header className="admin-workspace-header">
        <div><h1>{title} <em>{emphasis}</em></h1><p>{description}</p></div>
        <div className="admin-header-actions">
          <NavLink className="admin-secondary-action" to="/admin"><ArrowLeft size={15} /> Voltar ao painel</NavLink>
          <button className="admin-primary-action" type="button" disabled={busy} onClick={() => {
            setError(''); setFeedback(''); setEditor({ id: null, values: { ...props.defaults } })
          }}><Plus size={16} /> Novo {singular.toLocaleLowerCase('pt-BR')}</button>
        </div>
      </header>
      {feedback && <p className="admin-feedback" role="status">{feedback}</p>}
      {error && <p className="admin-state admin-state-error" role="alert">{error}</p>}
      <section className="admin-management" aria-label={`Gerenciamento de ${emphasis}`}>
        <div className="admin-management-toolbar">
          <form className="admin-search" role="search" onSubmit={event => { event.preventDefault(); setPage(1); setSearch(query.trim()) }}>
            <Search size={15} aria-hidden="true" />
            <input aria-label={`Buscar em ${emphasis}`} value={query} maxLength={200} onChange={event => setQuery(event.target.value)} placeholder={`Buscar em ${emphasis}…`} />
            <button className="filtro-btn" type="submit">Buscar</button>
          </form>
          <span>{state.data.total} registro{state.data.total !== 1 ? 's' : ''}</span>
        </div>
        {state.loading && <p className="admin-state" role="status">Carregando conteúdo…</p>}
        {state.error && <div className="admin-state admin-state-error" role="alert"><p>{state.error}</p><button type="button" className="filtro-btn" onClick={state.retry}>Tentar novamente</button></div>}
        {!state.loading && !state.error && items.length === 0 && <p className="admin-state">Nenhum registro encontrado.</p>}
        {!state.loading && !state.error && <div className="admin-record-list">
          {items.map(item => <article className="admin-record" key={item.id}>
            <div><h2>{item.title}</h2><p>{item.meta}</p></div>
            <span className={item.status === 'Rascunho' ? 'draft' : ''}>{item.status}</span>
            <div className="admin-record-actions">
              <button type="button" disabled={busy} onClick={() => void edit(item)}>Editar</button>
              {resource === 'agenda' && <button type="button" disabled={busy} onClick={() => void remove(item)}>Excluir</button>}
            </div>
          </article>)}
        </div>}
        {!state.loading && !state.error && <Pagination page={state.data.page} totalPages={state.data.totalPages} onChange={setPage} />}
      </section>
    </div>
    {editor && <AdminEditor key={editor.id ?? 'new'} {...props} editor={editor} onClose={() => setEditor(null)} onSaved={() => {
      setEditor(null); setFeedback('Dados salvos no banco com sucesso.'); state.retry()
    }} />}
  </main>
}

function AdminEditor({ resource, fields, singular, renderPreview, editor, onClose, onSaved }: Props & {
  editor: { id: string | null; values: FormValues }; onClose: () => void; onSaved: () => void
}) {
  const { csrfToken, refresh } = useAuth()
  const [values, setValues] = useState(editor.values)
  const [files, setFiles] = useState<Record<string, File>>({})
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const lock = useRef(false)
  const previews = useRef<Record<string, string>>({})
  const dialog = useDialog(() => { if (!lock.current) onClose() })
  useEffect(() => () => { Object.values(previews.current).forEach(url => URL.revokeObjectURL(url)) }, [])
  const update = (name: string, value: string) => setValues(current => ({ ...current, [name]: value }))
  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (lock.current) return
    if (!csrfToken) { setError('Entre novamente para salvar.'); return }
    lock.current = true; setSaving(true); setError('')
    try {
      const next = { ...values }
      for (const field of fields) {
        const file = files[field.name]
        if (file && field.urlField) {
          next[field.urlField] = (await uploadAdminFile(file, csrfToken)).url
          update(field.urlField, next[field.urlField])
          setFiles(current => { const remaining = { ...current }; delete remaining[field.name]; return remaining })
        }
      }
      if (await saveAdminForm(resource, next, editor.id, csrfToken, message => window.confirm(message))) onSaved()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível salvar.')
      if (err instanceof AdminApiError && err.status === 401) void refresh()
    } finally { lock.current = false; setSaving(false) }
  }
  const editing = editor.id !== null
  return <div className="admin-form-overlay" onMouseDown={event => { if (event.target === event.currentTarget && !saving) onClose() }}>
    <div ref={dialog} tabIndex={-1} className={renderPreview ? 'admin-form-panel has-preview' : 'admin-form-panel'} role="dialog" aria-modal="true" aria-labelledby="admin-form-title">
      <header>
        <div><span>{editing ? 'Editar registro' : 'Novo registro'}</span><h2 id="admin-form-title">{editing ? 'Editar' : 'Cadastrar'} {singular.toLocaleLowerCase('pt-BR')}</h2></div>
        <button type="button" disabled={saving} onClick={onClose} aria-label="Fechar formulário"><X size={19} /></button>
      </header>
      <div className="admin-form-content">
        <form onSubmit={submit} aria-busy={saving}>
          {fields.filter(field => !(field.onlyCreate && editing) && !(field.onlyEnd && (!editing || !values.ocupacaoAtualId || values.status === 'Titular em exercício'))).map(field => {
            const disabled = saving || (editing && field.readOnlyOnEdit) || (resource === 'cadeiras' && field.name === 'status' && (!editing || !values.ocupacaoAtualId))
              || (resource === 'cadeiras' && editing && !values.ocupacaoAtualId && ['nome', 'biografia', 'bioExtra', 'foto'].includes(field.name))
            const required = field.required || (field.publishedRequired && values.status === 'PUBLICADO') || field.onlyEnd
            const options = field.options?.map(option => typeof option === 'string' ? { value: option, label: option } : option)
            const stored = field.urlField ? values[field.urlField] : ''
            return <label className={field.type === 'textarea' ? 'admin-field admin-field-wide' : 'admin-field'} key={field.name}>
              <span>{field.label}</span>
              {field.type === 'textarea' ? <textarea name={field.name} rows={5} disabled={disabled} required={required} maxLength={field.maxLength} value={values[field.name] ?? ''} onChange={event => update(field.name, event.target.value)} />
                : field.type === 'select' ? <select name={field.name} disabled={disabled} required={required} value={values[field.name] ?? ''} onChange={event => update(field.name, event.target.value)}>
                  <option value="" disabled>Selecione</option>
                  {values[field.name] && !options?.some(option => option.value === values[field.name]) && <option value={values[field.name]}>{values[field.name]}</option>}
                  {options?.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
                  : field.type === 'file' ? <>
                    <input name={field.name} type="file" disabled={disabled} required={required && !stored} accept={field.accept} onChange={event => {
                      const file = event.target.files?.[0]
                      if (previews.current[field.name]) { URL.revokeObjectURL(previews.current[field.name]); delete previews.current[field.name] }
                      setFiles(current => { const next = { ...current }; if (file) next[field.name] = file; else delete next[field.name]; return next })
                      const preview = file && file.type.startsWith('image/') ? URL.createObjectURL(file) : ''
                      if (preview) previews.current[field.name] = preview
                      update(`${field.name}Preview`, preview)
                    }} />
                    {stored && <small>Arquivo atual preservado se nenhum novo for escolhido.</small>}
                  </> : <input name={field.name} type={field.type || 'text'} disabled={disabled} required={required} min={field.min} max={field.max} maxLength={field.maxLength} step={field.type === 'datetime-local' ? '0.001' : undefined} placeholder={field.placeholder} value={values[field.name] ?? ''} onChange={event => update(field.name, event.target.value)} />}
              {field.name === 'posse' && editing && !values.posse && values.inicioAno && <small>Registro histórico informa somente o ano {values.inicioAno}; nenhuma data foi inventada.</small>}
            </label>
          })}
          {resource === 'cadeiras' && <p className="admin-field-wide">Para trocar o titular, use “Novo membro” e informe o número da cadeira. A confirmação preservará o anterior no histórico.</p>}
          {error && <p className="admin-field-wide admin-state-error" role="alert">{error}</p>}
          <div className="admin-form-actions">
            <button type="button" disabled={saving} onClick={onClose}>Cancelar</button>
            <button type="submit" disabled={saving}>{saving ? 'Salvando…' : 'Salvar'}</button>
          </div>
        </form>
        {renderPreview && <aside className="admin-live-preview"><span>Pré-visualização</span>{renderPreview(values)}</aside>}
      </div>
    </div>
  </div>
}
