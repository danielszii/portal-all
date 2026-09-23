import { useMemo, useState } from 'react'
import { ArrowLeft, Plus, Search, X } from 'lucide-react'
import { NavLink } from 'react-router'

export type AdminListItem = {
  id: string
  title: string
  meta: string
  status?: string
}

export type AdminField = {
  name: string
  label: string
  type?: 'text' | 'date' | 'time' | 'number' | 'textarea' | 'select' | 'file'
  options?: string[]
  required?: boolean
  placeholder?: string
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
}: {
  title: string
  emphasis: string
  description: string
  singular: string
  items: AdminListItem[]
  fields: AdminField[]
  loading: boolean
  error: string | null
}) {
  const [query, setQuery] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [drafts, setDrafts] = useState<AdminListItem[]>([])
  const [feedback, setFeedback] = useState('')
  const allItems = [...drafts, ...items]
  const filteredItems = useMemo(() => {
    const term = query.trim().toLocaleLowerCase('pt-BR')
    return term ? allItems.filter(item => `${item.title} ${item.meta}`.toLocaleLowerCase('pt-BR').includes(term)) : allItems
  }, [allItems, query])

  const saveDraft = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const firstValue = fields.map(field => String(data.get(field.name) ?? '').trim()).find(Boolean)
    setDrafts(current => [{
      id: `draft-${Date.now()}`,
      title: firstValue || `Novo ${singular.toLocaleLowerCase('pt-BR')}`,
      meta: 'Criado nesta sessão · aguardando integração',
      status: 'Rascunho local',
    }, ...current])
    event.currentTarget.reset()
    setFeedback('Rascunho adicionado nesta sessão. A publicação dependerá da API administrativa.')
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
            <button className="admin-primary-action" type="button" onClick={() => { setFormOpen(true); setFeedback('') }}>
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
                <button type="button" title="Edição disponível após integração com a API" disabled>Editar</button>
              </article>
            ))}
          </div>
        </section>
      </div>

      {formOpen && (
        <div className="admin-form-overlay" role="presentation" onMouseDown={() => setFormOpen(false)}>
          <section className="admin-form-panel" role="dialog" aria-modal="true" aria-labelledby="admin-form-title" onMouseDown={event => event.stopPropagation()}>
            <header>
              <div><span>Novo registro</span><h2 id="admin-form-title">Cadastrar {singular.toLocaleLowerCase('pt-BR')}</h2></div>
              <button type="button" onClick={() => setFormOpen(false)} aria-label="Fechar formulário"><X size={19} /></button>
            </header>
            <form onSubmit={saveDraft}>
              {fields.map(field => (
                <label className={field.type === 'textarea' ? 'admin-field admin-field-wide' : 'admin-field'} key={field.name}>
                  <span>{field.label}</span>
                  {field.type === 'textarea' ? (
                    <textarea name={field.name} rows={5} required={field.required} placeholder={field.placeholder} />
                  ) : field.type === 'select' ? (
                    <select name={field.name} required={field.required} defaultValue="">
                      <option value="" disabled>Selecione</option>
                      {field.options?.map(option => <option key={option}>{option}</option>)}
                    </select>
                  ) : (
                    <input name={field.name} type={field.type || 'text'} required={field.required} placeholder={field.placeholder} />
                  )}
                </label>
              ))}
              <div className="admin-form-actions">
                <button type="button" onClick={() => setFormOpen(false)}>Cancelar</button>
                <button type="submit">Salvar rascunho local</button>
              </div>
            </form>
          </section>
        </div>
      )}
    </main>
  )
}
