import { useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { ArrowLeft, Plus, Search, X } from 'lucide-react'
import { NavLink } from 'react-router'

export type AdminListItem = {
  id: string
  title: string
  meta: string
  status?: string
  values?: Record<string, string>
}

export type AdminField = {
  name: string
  label: string
  type?: 'text' | 'date' | 'time' | 'number' | 'textarea' | 'select' | 'file'
  options?: string[]
  required?: boolean
  placeholder?: string
  accept?: string
}

export default function AdminResourcePage({
  title,
  emphasis,
  description,
  singular,
  items,
  fields,
  loading,
  error,
  renderPreview,
}: {
  title: string
  emphasis: string
  description: string
  singular: string
  items: AdminListItem[]
  fields: AdminField[]
  loading: boolean
  error: string | null
  renderPreview?: (values: Record<string, string>) => ReactNode
}) {
  const [query, setQuery] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [drafts, setDrafts] = useState<AdminListItem[]>([])
  const [feedback, setFeedback] = useState('')
  const [formValues, setFormValues] = useState<Record<string, string>>({})
  const [editingId, setEditingId] = useState<string | null>(null)
  const allItems = [...drafts, ...items]
  const filteredItems = useMemo(() => {
    const term = query.trim().toLocaleLowerCase('pt-BR')
    return term ? allItems.filter(item => `${item.title} ${item.meta}`.toLocaleLowerCase('pt-BR').includes(term)) : allItems
  }, [allItems, query])

  const openNewForm = () => {
    setEditingId(null)
    setFormValues({})
    setFeedback('')
    setFormOpen(true)
  }

  const openEditForm = (item: AdminListItem) => {
    setEditingId(item.id)
    setFormValues(item.values ?? { [fields[0]?.name ?? 'titulo']: item.title })
    setFeedback('')
    setFormOpen(true)
  }

  const updateField = (name: string, value: string) => {
    setFormValues(current => ({ ...current, [name]: value }))
  }

  const saveDraft = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const firstValue = fields.map(field => formValues[field.name]?.trim()).find(Boolean)
    setDrafts(current => [{
      id: `draft-${Date.now()}`,
      title: firstValue || `Novo ${singular.toLocaleLowerCase('pt-BR')}`,
      meta: 'Criado nesta sessão · aguardando integração',
      status: 'Rascunho local',
      values: formValues,
    }, ...current])
    setFormValues({})
    setFeedback(editingId ? 'Edição salva como rascunho local nesta sessão.' : 'Rascunho adicionado nesta sessão. A publicação dependerá da API administrativa.')
    setFormOpen(false)
  }

  return (
    <main className="admin-page admin-workspace-page">
      <div className="wrap admin-workspace">
        <header className="admin-workspace-header">
          <div>
            <h1>{title} <em>{emphasis}</em></h1>
            <p>{description}</p>
          </div>
          <div className="admin-header-actions">
            <NavLink className="admin-secondary-action" to="/admin"><ArrowLeft size={15} /> Voltar ao painel</NavLink>
            <button className="admin-primary-action" type="button" onClick={openNewForm}>
              <Plus size={16} /> Novo {singular.toLocaleLowerCase('pt-BR')}
            </button>
          </div>
        </header>

        {feedback && <p className="admin-feedback" role="status">{feedback}</p>}

        <section className="admin-management" aria-label={`Gerenciamento de ${title.toLocaleLowerCase('pt-BR')}`}>
          <div className="admin-management-toolbar">
            <label className="admin-search">
              <Search size={15} aria-hidden="true" />
              <input value={query} onChange={event => setQuery(event.target.value)} placeholder={`Buscar em ${title.toLocaleLowerCase('pt-BR')}…`} />
            </label>
            <span>{filteredItems.length} registro{filteredItems.length === 1 ? '' : 's'}</span>
          </div>

          {loading && <p className="admin-state">Carregando conteúdo…</p>}
          {error && <p className="admin-state admin-state-error">Não foi possível carregar os registros atuais.</p>}
          {!loading && !error && filteredItems.length === 0 && <p className="admin-state">Nenhum registro encontrado.</p>}

          <div className="admin-record-list">
            {filteredItems.map(item => (
              <article className="admin-record" key={item.id}>
                <div>
                  <h2>{item.title}</h2>
                  <p>{item.meta}</p>
                </div>
                <span className={item.status === 'Rascunho local' ? 'draft' : ''}>{item.status || 'Publicado'}</span>
                <button type="button" onClick={() => openEditForm(item)}>Editar</button>
              </article>
            ))}
          </div>
        </section>
      </div>

      {formOpen && (
        <div className="admin-form-overlay" role="presentation" onMouseDown={() => setFormOpen(false)}>
          <section className={renderPreview ? 'admin-form-panel has-preview' : 'admin-form-panel'} role="dialog" aria-modal="true" aria-labelledby="admin-form-title" onMouseDown={event => event.stopPropagation()}>
            <header>
              <div><span>{editingId ? 'Editar registro' : 'Novo registro'}</span><h2 id="admin-form-title">{editingId ? 'Editar' : 'Cadastrar'} {singular.toLocaleLowerCase('pt-BR')}</h2></div>
              <button type="button" onClick={() => setFormOpen(false)} aria-label="Fechar formulário"><X size={19} /></button>
            </header>
            <div className="admin-form-content">
              <form onSubmit={saveDraft}>
                {fields.map(field => (
                  <label className={field.type === 'textarea' ? 'admin-field admin-field-wide' : 'admin-field'} key={field.name}>
                    <span>{field.label}</span>
                    {field.type === 'textarea' ? (
                      <textarea name={field.name} rows={5} required={field.required} placeholder={field.placeholder} value={formValues[field.name] ?? ''} onChange={event => updateField(field.name, event.target.value)} />
                    ) : field.type === 'select' ? (
                      <select name={field.name} required={field.required} value={formValues[field.name] ?? ''} onChange={event => updateField(field.name, event.target.value)}>
                        <option value="" disabled>Selecione</option>
                        {field.options?.map(option => <option key={option}>{option}</option>)}
                      </select>
                    ) : field.type === 'file' ? (
                      <input name={field.name} type="file" required={field.required} accept={field.accept} onChange={event => {
                        const file = event.target.files?.[0]
                        if (file) updateField(`${field.name}Preview`, URL.createObjectURL(file))
                      }} />
                    ) : (
                      <input name={field.name} type={field.type || 'text'} required={field.required} placeholder={field.placeholder} value={formValues[field.name] ?? ''} onChange={event => updateField(field.name, event.target.value)} />
                    )}
                  </label>
                ))}
                <div className="admin-form-actions">
                  <button type="button" onClick={() => setFormOpen(false)}>Cancelar</button>
                  <button type="submit">Salvar rascunho local</button>
                </div>
              </form>
              {renderPreview && <aside className="admin-live-preview"><span>Pré-visualização</span>{renderPreview(formValues)}</aside>}
            </div>
          </section>
        </div>
      )}
    </main>
  )
}
