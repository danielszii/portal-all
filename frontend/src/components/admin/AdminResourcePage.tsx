import { lazy, Suspense, useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { Eye, Monitor, Pencil, Plus, Search, Smartphone, Tablet, Trash2, X } from 'lucide-react'
import { NavLink } from 'react-router'
import { useAuth } from '@/contexts/AuthContext'
import { useResource } from '@/hooks/useResource'
import { useDialog } from '@/hooks/useDialog'
import Pagination from '@/components/Pagination'
import AdminPageHeader from '@/components/admin/AdminPageHeader'
import { useAdminConfirm } from '@/components/admin/AdminConfirmDialog'
import FormattedTextarea from '@/components/admin/FormattedTextarea'
import { convertCoverImage } from '@/utils/cover-image'
const PdfCoverPicker = lazy(() => import('@/components/admin/PdfCoverPicker'))
import { canOpenAdminPage } from '@/services/admin-permissions'
import { adminItem, deleteAdminRecord, loadAdminPage, loadAdminRecord, saveAdminForm, uploadAdminFile, AdminApiError,
  type AdminResource, type FormValues, type AdminListItem, type AdminPage, type AdminRecord } from '@/services/admin'

export type AdminField = {
  name: string; label: string; type?: 'text' | 'date' | 'datetime-local' | 'number' | 'textarea' | 'select' | 'file' | 'publication'
  options?: (string | { value: string; label: string })[]; required?: boolean; placeholder?: string; accept?: string
  publishedRequired?: boolean; urlField?: string; readOnlyOnEdit?: boolean; onlyEnd?: boolean
  allowCustom?: boolean
  requiredWhen?: (values: FormValues) => boolean
  min?: number; max?: number; maxLength?: number
}
type Props = {
  resource: AdminResource; title: string; emphasis: string; description: string; singular: string
  fields: AdminField[]; defaults?: FormValues; renderPreview?: (values: FormValues) => ReactNode
  relatedActions?: { label: string; to: string }[]
}
const empty: AdminPage<AdminRecord> = { items: [], page: 1, pageSize: 20, total: 0, totalPages: 1 }
const publicationHelp: Record<string, string> = {
  PUBLICADO: 'Fica visível para todos assim que você salvar.',
  RASCUNHO: 'Fica guardado somente no painel para terminar depois.',
  ARQUIVADO: 'Sai do site, mas continua guardado no painel.',
}

export default function AdminResourcePage(props: Props) {
  const { resource, title, emphasis, description, singular } = props
  const { csrfToken, refresh, can } = useAuth()
  const canEdit = can(resource === 'cadeiras' ? 'instituicao:editar' : 'conteudo:editar')
  const [query, setQuery] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [editor, setEditor] = useState<{ id: string | null; values: FormValues; fixedChairNumber?: boolean } | null>(null)
  const [busy, setBusy] = useState(false)
  const [feedback, setFeedback] = useState('')
  const [error, setError] = useState('')
  const confirmation = useAdminConfirm()
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
    try {
      const values = adminItem(resource, await loadAdminRecord(resource, item.id)).values
      if (resource === 'cadeiras' && item.status === 'Vaga') {
        setEditor({ id: null, fixedChairNumber: true, values: {
          ...values, nome: '', posse: '', fimEm: '',
          biografia: '', bioExtra: '', fotoUrl: '',
        } })
      } else setEditor({ id: item.id, values })
    }
    catch (err) { handleError(err) }
    finally { setBusy(false) }
  }
  const remove = async (item: AdminListItem) => {
    if (!csrfToken || resource === 'cadeiras' || !can('registros:excluir')) return
    const consequence = resource === 'agenda' ? ' e suas referências na galeria' : ''
    const accepted = await confirmation.confirm({
      title: `Excluir ${singular.toLocaleLowerCase('pt-BR')}?`,
      message: `“${item.title}” será excluído definitivamente${consequence}. Esta ação não pode ser desfeita. Se quiser apenas escondê-lo do público, escolha “Retirar do site” na edição.`,
      confirmLabel: 'Excluir definitivamente',
      tone: 'danger',
    })
    if (!accepted) return
    setBusy(true); setError(''); setFeedback('')
    try {
      await deleteAdminRecord(resource, item.id, csrfToken)
      setFeedback(`${singular} ${singular.endsWith('a') ? 'excluída' : 'excluído'} com sucesso.`); state.retry()
    } catch (err) { handleError(err) }
    finally { setBusy(false) }
  }
  return <><main className="admin-page admin-workspace-page">
    <div className="wrap admin-workspace">
      <AdminPageHeader title={title} emphasis={emphasis} description={description}>
        {props.relatedActions?.filter(action => canOpenAdminPage(action.to, can)).map(action => <NavLink className="admin-secondary-action" to={action.to} key={action.to}>{action.label}</NavLink>)}
        {canEdit && <button className="admin-primary-action" type="button" disabled={busy} onClick={() => {
          setError(''); setFeedback(''); setEditor({ id: null, values: { ...props.defaults } })
        }}><Plus size={16} aria-hidden="true" /> Novo {singular.toLocaleLowerCase('pt-BR')}</button>}
      </AdminPageHeader>
      {feedback && <p className="admin-feedback" role="status">{feedback}</p>}
      {error && <p className="admin-state admin-state-error" role="alert">{error}</p>}
      <section className="admin-management" aria-label={`Gerenciamento de ${emphasis}`}>
        <div className="admin-management-toolbar">
          <form className="admin-search" role="search" onSubmit={event => { event.preventDefault(); setPage(1); setSearch(query.trim()) }}>
            <Search size={15} aria-hidden="true" />
            <input aria-label={`Buscar em ${emphasis}`} value={query} maxLength={200} onChange={event => setQuery(event.target.value)} placeholder={`Buscar em ${emphasis}…`} />
            <button className="filtro-btn" type="submit">Buscar</button>
            {search && <button className="admin-search-reset" type="button" aria-label="Limpar busca" title="Limpar busca" onClick={() => { setQuery(''); setSearch(''); setPage(1) }}><X size={14} aria-hidden="true" /></button>}
          </form>
          <span>{state.data.total} registro{state.data.total !== 1 ? 's' : ''}</span>
        </div>
        {state.loading && <p className="admin-state" role="status">Carregando conteúdo…</p>}
        {state.error && <div className="admin-state admin-state-error" role="alert"><p>{state.error}</p><button type="button" className="filtro-btn" onClick={state.retry}>Tentar novamente</button></div>}
        {!state.loading && !state.error && items.length === 0 && <p className="admin-state">Nenhum registro encontrado.</p>}
        {!state.loading && !state.error && <div className="admin-record-list">
          {items.map(item => <article className="admin-record" key={item.id}>
            <div><h2>{item.title}</h2><p>{item.meta}</p></div>
            <span className={item.status === 'Somente no painel' ? 'draft' : item.status === 'Visível no site' ? 'is-published' : item.status === 'Retirado do site' ? 'is-inactive' : ''}>{item.status}</span>
            <div className="admin-record-actions">
              <button className="admin-edit-action" type="button" disabled={busy} onClick={() => void edit(item)}>{canEdit ? <Pencil size={14} aria-hidden="true" /> : <Eye size={14} aria-hidden="true" />} {canEdit && resource === 'cadeiras' && item.status === 'Vaga' ? 'Adicionar titular' : canEdit ? 'Editar' : 'Visualizar'}</button>
              {resource !== 'cadeiras' && can('registros:excluir') && <button className="admin-delete-action" type="button" disabled={busy} title="Excluir definitivamente" onClick={() => void remove(item)}><Trash2 size={14} aria-hidden="true" /> Excluir</button>}
            </div>
          </article>)}
        </div>}
        {!state.loading && !state.error && <Pagination page={state.data.page} totalPages={state.data.totalPages} onChange={setPage} />}
      </section>
    </div>
    {editor && <AdminEditor key={editor.id ?? (editor.fixedChairNumber ? `vacant-chair-${editor.values.cadeira}` : 'new')} {...props} editor={editor} fixedChairNumber={editor.fixedChairNumber} onClose={() => setEditor(null)} onSaved={() => {
      setEditor(null); setFeedback('Dados salvos no banco com sucesso.'); state.retry()
    }} />}
  </main>{confirmation.dialog}</>
}

function AdminEditor({ resource, fields, singular, renderPreview, editor, fixedChairNumber, onClose, onSaved }: Props & {
  editor: { id: string | null; values: FormValues }; fixedChairNumber?: boolean; onClose: () => void; onSaved: () => void
}) {
  const { csrfToken, refresh, can } = useAuth()
  const readOnly = !can(resource === 'cadeiras' ? 'instituicao:editar' : 'conteudo:editar')
  const [values, setValues] = useState(editor.values)
  const [files, setFiles] = useState<Record<string, File>>({})
  const [coverPending, setCoverPending] = useState(false)
  const [coverMode, setCoverMode] = useState<'keep' | 'pdf' | 'image' | 'none'>('keep')
  const [coverError, setCoverError] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [previewViewport, setPreviewViewport] = useState<'desktop' | 'tablet' | 'mobile'>('desktop')
  const confirmation = useAdminConfirm()
  const lock = useRef(false)
  const previews = useRef<Record<string, string>>({})
  const coverGeneration = useRef(0)
  const dialog = useDialog(() => { if (!lock.current) onClose() })
  useEffect(() => () => { coverGeneration.current++; Object.values(previews.current).forEach(url => URL.revokeObjectURL(url)) }, [])
  const update = (name: string, value: string) => setValues(current => ({ ...current, [name]: value }))
  const setPdfCover = useCallback((file: File) => {
    if (previews.current.capa) URL.revokeObjectURL(previews.current.capa)
    const preview = URL.createObjectURL(file)
    previews.current.capa = preview
    setFiles(current => ({ ...current, capa: file }))
    setValues(current => ({ ...current, capaPreview: preview }))
    setCoverPending(false)
  }, [])
  const pendingPdfCover = useCallback(() => {
    setCoverPending(true)
    setFiles(current => { const next = { ...current }; delete next.capa; return next })
  }, [])
  const changeCoverMode = (mode: 'keep' | 'pdf' | 'image' | 'none') => {
    coverGeneration.current++
    setCoverMode(mode); setCoverError('')
    setCoverPending(mode === 'pdf' || mode === 'image')
    if (previews.current.capa) { URL.revokeObjectURL(previews.current.capa); delete previews.current.capa }
    setFiles(current => { const next = { ...current }; delete next.capa; return next })
    setValues(current => ({ ...current, capaPreview: '', capaUrl: mode === 'none' ? '' : editor.values.capaUrl ?? '' }))
  }
  const selectCoverImage = async (file: File) => {
    const generation = ++coverGeneration.current
    setCoverError(''); setCoverPending(true)
    try {
      const converted = await convertCoverImage(file)
      if (generation === coverGeneration.current) setPdfCover(converted)
    } catch (error) {
      if (generation === coverGeneration.current) setCoverError(error instanceof Error ? error.message : 'Não foi possível carregar a imagem.')
    }
  }
  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (lock.current || readOnly || coverPending) return
    if (!csrfToken) { setError('Entre novamente para salvar.'); return }
    lock.current = true; setSaving(true); setError('')
    try {
      if (values.status === 'PUBLICADO' && (editor.id === null || editor.values.status !== 'PUBLICADO')) {
        const accepted = await confirmation.confirm({
          title: 'Mostrar no site agora?',
          message: 'Ao confirmar, este conteúdo ficará visível para todos assim que for salvo.',
          confirmLabel: 'Salvar e mostrar',
          tone: 'warning',
        })
        if (!accepted) return
      }
      const next = { ...values }
      for (const field of fields) {
        const file = files[field.name]
        if (file && field.urlField) {
          const isPublication = resource === 'acervo' && field.urlField === 'pdfUrl'
          const upload = isPublication && file.type.startsWith('image/') && !['image/png', 'image/jpeg', 'image/webp'].includes(file.type)
            ? await convertCoverImage(file, 40_000_000) : file
          next[field.urlField] = (await uploadAdminFile(upload, csrfToken, isPublication ? 'publication' : 'image')).url
          update(field.urlField, next[field.urlField])
          if (!(resource === 'acervo' && field.name === 'arquivo')) setFiles(current => { const remaining = { ...current }; delete remaining[field.name]; return remaining })
        }
      }
      if (files.capa && resource === 'acervo') {
        next.capaUrl = (await uploadAdminFile(files.capa, csrfToken, 'image')).url
        update('capaUrl', next.capaUrl)
        setFiles(current => { const remaining = { ...current }; delete remaining.capa; return remaining })
      }
      if (await saveAdminForm(resource, next, editor.id, csrfToken, message => confirmation.confirm({
        title: 'Confirmar alteração?', message, confirmLabel: 'Confirmar alteração', tone: 'warning',
      }))) onSaved()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível salvar.')
      if (err instanceof AdminApiError && err.status === 401) void refresh()
    } finally { lock.current = false; setSaving(false) }
  }
  const editing = editor.id !== null
  const saveLabel = values.status === 'PUBLICADO' ? 'Salvar e mostrar no site' : values.status === 'RASCUNHO' ? 'Salvar somente no painel' : values.status === 'ARQUIVADO' ? 'Salvar e retirar do site' : 'Salvar alterações'
  return <><div className="admin-form-overlay" onMouseDown={event => { if (event.target === event.currentTarget && !saving) onClose() }}>
    <div ref={dialog} tabIndex={-1} className={renderPreview ? 'admin-form-panel has-preview' : 'admin-form-panel'} role="dialog" aria-modal="true" aria-labelledby="admin-form-title">
      <header>
        <div><span>{readOnly ? 'Consulta' : editing ? 'Editar registro' : 'Novo registro'}</span><h2 id="admin-form-title">{readOnly ? 'Visualizar' : editing ? 'Editar' : 'Cadastrar'} {singular.toLocaleLowerCase('pt-BR')}</h2></div>
        <button type="button" disabled={saving} onClick={onClose} aria-label="Fechar formulário"><X size={19} /></button>
      </header>
      <div className="admin-form-content">
        <form onSubmit={submit} aria-busy={saving}>
          <span className="visually-hidden" role="status" aria-live="polite">{saving ? 'Salvando dados, aguarde.' : ''}</span>
          <p className="admin-form-guidance admin-field-wide">{readOnly ? 'Visualização somente para consulta.' : 'Preencha os campos marcados com * antes de salvar.'}</p>
          {resource === 'cadeiras' && fixedChairNumber && (
            <select hidden name="status" value="Titular em exercício" disabled aria-hidden="true" tabIndex={-1} onChange={() => undefined}>
              <option value="Titular em exercício">Titular em exercício</option>
            </select>
          )}
          {fields.filter(field => !(field.onlyEnd && (!editing || !values.ocupacaoAtualId))).map(field => {
            const hasMember = Boolean(values.ocupacaoAtualId || values.academicoId || values.nome?.trim())
            const isCadeiraSemMembro = resource === 'cadeiras' && editing && !hasMember
            const disabled = readOnly || saving || (editing && field.readOnlyOnEdit)
              || (isCadeiraSemMembro && ['nome', 'biografia', 'bioExtra', 'foto', 'status', 'posse', 'fimEm'].includes(field.name))

            const required = (field.requiredWhen ? field.requiredWhen(values) : field.required) || (field.publishedRequired && values.status === 'PUBLICADO')
            const options = field.options?.map(option => typeof option === 'string' ? { value: option, label: option } : option)
            const stored = field.urlField ? values[field.urlField] : ''
            if (field.type === 'publication') return <fieldset className='admin-publication-choice admin-field-wide' key={field.name}>
              <legend>{field.label}</legend>
              <p>Escolha o que deve acontecer com este conteúdo ao salvar.</p>
              <div>{options?.map(option => <label className={values[field.name] === option.value ? 'is-selected' : ''} key={option.value}>
                <input type='radio' name={field.name} value={option.value} checked={values[field.name] === option.value} disabled={disabled} onChange={() => update(field.name, option.value)} />
                <span><strong>{option.label}</strong><small>{publicationHelp[option.value]}</small></span>
              </label>)}</div>
            </fieldset>
            if (field.type === 'select' && field.allowCustom) {
              const custom = values[`${field.name}Modo`] === 'custom' || (!!values[field.name] && !options?.some(option => option.value === values[field.name]))
              return <div className="admin-field" key={field.name}>
                <label htmlFor={`admin-${field.name}`}>{field.label}{required ? ' *' : ''}</label>
                <select id={`admin-${field.name}`} name={`${field.name}Selecao`} disabled={disabled} required={required} value={custom ? '__custom__' : values[field.name] ?? ''} onChange={event => {
                  const selection = event.target.value
                  setValues(current => ({ ...current, [field.name]: selection === '__custom__' ? '' : selection, [`${field.name}Modo`]: selection === '__custom__' ? 'custom' : '' }))
                }}>
                  <option value="" disabled>Selecione</option>
                  {options?.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
                  <option value="__custom__">Personalizado</option>
                </select>
                {custom && <label className="admin-field"><span>Tipo personalizado *</span><input name={field.name} type="text" maxLength={100} required disabled={disabled} value={values[field.name] ?? ''} placeholder="Digite o tipo da publicação" onChange={event => update(field.name, event.target.value)} /></label>}
              </div>
            }
            const FieldContainer = field.type === 'textarea' ? 'div' : 'label'
            return <FieldContainer className={field.type === 'textarea' ? 'admin-field admin-field-wide' : 'admin-field'} key={field.name}>
              <span>{field.label}{required ? ' *' : ''}</span>
              {field.type === 'textarea' ? <FormattedTextarea aria-label={field.label} name={field.name} rows={5} disabled={disabled} required={required} maxLength={field.maxLength} value={values[field.name] ?? ''} onChange={value => update(field.name, value)} />
                  : field.type === 'select' ? <><select name={field.name} disabled={disabled} required={required} value={values[field.name] ?? ''} onChange={event => {
                    if (resource === 'acervo' && field.name === 'autorId') {
                      const selected = options?.find(option => option.value === event.target.value)
                      setValues(current => ({ ...current, autorId: event.target.value, autorAlterado: 'true', autoriaTexto: selected?.label ?? '' }))
                    } else update(field.name, event.target.value)
                  }}>
                  <option value="" disabled>Selecione</option>
                  {values[field.name] && !options?.some(option => option.value === values[field.name]) && <option value={values[field.name]}>{values[field.name]}</option>}
                  {options?.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>{resource === 'acervo' && field.name === 'autorId' && values.autoriaTexto && !values.autorId && <small>Autoria atual: {values.autoriaTexto}. Selecione um acadêmico para criar ou alterar o vínculo.</small>}
                {resource === 'acervo' && field.name === 'autorId' && Number(values.autorCount) > 1 && <small>Esta publicação possui mais de um autor vinculado. Selecionar outro substituirá os vínculos atuais.</small>}</>
                  : field.type === 'file' ? <>
                    <input name={field.name} type="file" disabled={disabled} required={required && !stored} accept={field.accept} onChange={event => {
                      const file = event.target.files?.[0]
                      if (resource === 'acervo' && field.name === 'arquivo' && file && coverMode === 'pdf') {
                        setCoverPending(true)
                        if (previews.current.capa) { URL.revokeObjectURL(previews.current.capa); delete previews.current.capa }
                        setValues(current => ({ ...current, capaUrl: '', capaPreview: '' }))
                        setFiles(current => { const next = { ...current }; delete next.capa; return next })
                      }
                      if (previews.current[field.name]) { URL.revokeObjectURL(previews.current[field.name]); delete previews.current[field.name] }
                      setFiles(current => { const next = { ...current }; if (file) next[field.name] = file; else delete next[field.name]; return next })
                      const preview = file && file.type.startsWith('image/') ? URL.createObjectURL(file) : ''
                      if (preview) previews.current[field.name] = preview
                      update(`${field.name}Preview`, preview)
                    }} />
                    {stored && <small>Arquivo atual preservado se nenhum novo for escolhido.</small>}
                  </> : <input name={field.name} type={field.type || 'text'} disabled={disabled} required={required} min={field.min} max={field.max} maxLength={field.maxLength} step={field.type === 'datetime-local' ? '0.001' : undefined} placeholder={field.placeholder} value={values[field.name] ?? ''} onChange={event => update(field.name, event.target.value)} />}
              {field.name === 'posse' && editing && !values.posse && values.inicioAno && <small>Registro histórico informa somente o ano {values.inicioAno}; nenhuma data foi inventada.</small>}
            </FieldContainer>
          })}
          {resource === 'acervo' && <fieldset className="admin-field-wide cover-choice" disabled={readOnly || saving}>
            <legend>Capa da publicação</legend>
            <p>Escolha como deseja apresentar a capa no site.</p>
            <div className="cover-choice-options">
              <label><input type="radio" name="coverMode" checked={coverMode === 'keep'} onChange={() => changeCoverMode('keep')} /> {editor.values.capaUrl ? 'Manter capa atual' : 'Usar capa colorida'}</label>
              <label><input type="radio" name="coverMode" checked={coverMode === 'pdf'} onChange={() => changeCoverMode('pdf')} /> Escolher página do PDF</label>
              <label><input type="radio" name="coverMode" checked={coverMode === 'image'} onChange={() => changeCoverMode('image')} /> Enviar imagem de capa</label>
              {editor.values.capaUrl && <label><input type="radio" name="coverMode" checked={coverMode === 'none'} onChange={() => changeCoverMode('none')} /> Usar capa colorida</label>}
            </div>
            {coverMode === 'pdf' && (files.arquivo?.type === 'application/pdf'
              ? <Suspense fallback={<p role="status">Carregando visualizador de PDF…</p>}><PdfCoverPicker file={files.arquivo} disabled={readOnly || saving} onCover={setPdfCover} onPending={pendingPdfCover} /></Suspense>
              : <small>Anexe um PDF acima para escolher uma página. Para imagens, escolha uma capa própria ou colorida.</small>)}
            {coverMode === 'image' && <label className="admin-field"><span>Imagem da capa</span>
              <input type="file" accept="image/*" onChange={event => { const file = event.target.files?.[0]; if (file) void selectCoverImage(file) }} />
              <small>Até 10 MB. Formatos que o navegador conseguir abrir serão convertidos em PNG.</small>
            </label>}
            {coverError && <p className="admin-state-error" role="alert">{coverError}</p>}
          </fieldset>}
          {!readOnly && resource === 'cadeiras' && <p className="admin-field-wide">Para trocar o titular, use “Novo membro” e informe o número da cadeira. A confirmação preservará o anterior no histórico.</p>}
          {error && <p className="admin-field-wide admin-state-error" role="alert">{error}</p>}
          <div className="admin-form-actions">
            <button type="button" disabled={saving} onClick={onClose}>{readOnly ? 'Fechar' : 'Cancelar'}</button>
            {!readOnly && <button type="submit" disabled={saving || coverPending}>{saving ? 'Salvando…' : coverPending ? 'Aguardando capa…' : saveLabel}</button>}
          </div>
        </form>
        {renderPreview && <aside className={`admin-live-preview preview-${previewViewport}`} aria-label="Pré-visualização do conteúdo">
          <div className="admin-preview-toolbar">
            <span>Pré-visualização</span>
            <div role="group" aria-label="Tamanho da pré-visualização">
              <button type="button" aria-label="Visualizar em desktop" aria-pressed={previewViewport === 'desktop'} onClick={() => setPreviewViewport('desktop')}><Monitor size={15} /></button>
              <button type="button" aria-label="Visualizar em tablet" aria-pressed={previewViewport === 'tablet'} onClick={() => setPreviewViewport('tablet')}><Tablet size={15} /></button>
              <button type="button" aria-label="Visualizar em celular" aria-pressed={previewViewport === 'mobile'} onClick={() => setPreviewViewport('mobile')}><Smartphone size={15} /></button>
            </div>
          </div>
          <div className="admin-preview-viewport">{renderPreview(values)}</div>
        </aside>}
      </div>
    </div>
  </div>{confirmation.dialog}</>
}
