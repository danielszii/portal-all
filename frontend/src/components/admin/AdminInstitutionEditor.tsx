import { useCallback, useRef, useState, type FormEvent } from 'react'
import { Plus, Trash2, X } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useDialog } from '@/hooks/useDialog'
import { useResource } from '@/hooks/useResource'
import { AdminApiError } from '@/services/admin'
import { institutionValues, loadAdminInstitution, saveAdminInstitution, type AdminInstitution, type InstitutionValues } from '@/services/admin-instituicao'

type Field = { name: Exclude<keyof InstitutionValues, 'redesSociais'>; label: string; type?: 'text' | 'email' | 'tel' | 'number' | 'textarea'; required?: boolean; maxLength?: number }
const fields: Field[] = [
  { name: 'nome', label: 'Nome oficial', required: true, maxLength: 300 },
  { name: 'fundacaoAno', label: 'Ano de fundação', type: 'number' },
  { name: 'email', label: 'E-mail institucional', type: 'email', maxLength: 254 },
  { name: 'telefone', label: 'Telefone', type: 'tel', maxLength: 50 },
  { name: 'endereco', label: 'Endereço', maxLength: 1000 },
  { name: 'horarioAtendimento', label: 'Horário de atendimento', maxLength: 500 },
  { name: 'emailImprensa', label: 'E-mail de imprensa', type: 'email', maxLength: 254 },
  { name: 'mapaUrl', label: 'Link público do mapa', maxLength: 2048 },
  { name: 'historia', label: 'História', type: 'textarea', required: true, maxLength: 100000 },
  { name: 'missao', label: 'Missão', type: 'textarea', required: true, maxLength: 20000 },
  { name: 'sedeTexto', label: 'Sede', type: 'textarea', maxLength: 20000 },
  { name: 'trajetoriaTexto', label: 'Trajetória', type: 'textarea', maxLength: 20000 },
]

export default function AdminInstitutionEditor({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const { refresh } = useAuth()
  const [saving, setSaving] = useState(false)
  const busy = useRef(false)
  const close = () => { if (!busy.current) onClose() }
  const dialog = useDialog(close)
  const load = useCallback(async (signal: AbortSignal) => {
    try { return await loadAdminInstitution(signal) }
    catch (error) { if (error instanceof AdminApiError && [401, 403].includes(error.status)) void refresh(); throw error }
  }, [refresh])
  const state = useResource(load, { info: null })
  return <div className="admin-form-overlay">
    <div ref={dialog} tabIndex={-1} className="admin-form-panel" role="dialog" aria-modal="true" aria-labelledby="institution-form-title">
      <header><h2 id="institution-form-title">Dados da instituição</h2><button type="button" disabled={saving} onClick={close} aria-label="Fechar formulário"><X size={19} /></button></header>
      {state.loading && <p className="admin-state" role="status">Carregando dados atuais…</p>}
      {state.error && <div className="admin-state admin-state-error" role="alert"><p>{state.error}</p><button className="filtro-btn" type="button" onClick={state.retry}>Tentar novamente</button></div>}
      {!state.loading && !state.error && <InstitutionForm info={state.data.info} onClose={close} onSaved={onSaved} onSaving={value => { busy.current = value; setSaving(value) }} />}
    </div>
  </div>
}

function InstitutionForm({ info, onClose, onSaved, onSaving }: {
  info: AdminInstitution | null; onClose: () => void; onSaved: () => void; onSaving: (value: boolean) => void
}) {
  const { csrfToken, can, refresh } = useAuth()
  const [values, setValues] = useState(() => institutionValues(info))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const lock = useRef(false)
  const allowed = can('instituicao:editar')
  const year = Number(new Intl.DateTimeFormat('en', { year: 'numeric', timeZone: 'America/Fortaleza' }).format(new Date()))
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (lock.current || !allowed || !csrfToken) return
    if (!event.currentTarget.reportValidity()) return
    if (fields.some(field => field.required && !values[field.name].trim())) { setError('Preencha nome, história e missão.'); return }
    lock.current = true; setSaving(true); onSaving(true); setError('')
    try {
      await saveAdminInstitution(values, info?.atualizadoEm ?? null, csrfToken)
      onSaved()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível salvar os dados.')
      if (err instanceof AdminApiError && [401, 403].includes(err.status)) void refresh()
    } finally { lock.current = false; setSaving(false); onSaving(false) }
  }
  return <div className="admin-form-content"><form onSubmit={submit} aria-busy={saving}>
    <p className="admin-field-wide">As alterações serão publicadas no portal ao salvar. Nome, história e missão são obrigatórios.</p>
    {fields.map(field => <label className={field.type === 'textarea' ? 'admin-field admin-field-wide' : 'admin-field'} key={field.name}>
      <span>{field.label}{field.required ? ' *' : ''}</span>
      {field.type === 'textarea'
        ? <textarea name={field.name} rows={5} required={field.required} maxLength={field.maxLength} disabled={saving || !allowed} value={values[field.name]} onChange={event => setValues(current => ({ ...current, [field.name]: event.target.value }))} />
        : <input name={field.name} type={field.type ?? 'text'} required={field.required} maxLength={field.maxLength} min={field.type === 'number' ? 1 : undefined} max={field.type === 'number' ? year : undefined} step={field.type === 'number' ? 1 : undefined} disabled={saving || !allowed} value={values[field.name]} onChange={event => setValues(current => ({ ...current, [field.name]: event.target.value }))} />}
    </label>)}
    <fieldset className="admin-institution-socials admin-field-wide" disabled={saving || !allowed}>
      <legend>Redes sociais</legend>
      {values.redesSociais.map((link, index) => <div className="admin-institution-social-row" key={index}>
        <label className="admin-field"><span>Nome</span><input name={`redesSociais.${index}.nome`} maxLength={50} value={link.nome} required={Boolean(link.nome || link.url)} onChange={event => setValues(current => ({
          ...current,
          redesSociais: current.redesSociais.map((item, itemIndex) => itemIndex === index ? { ...item, nome: event.target.value } : item),
        }))} /></label>
        <label className="admin-field"><span>Link</span><input name={`redesSociais.${index}.url`} type="url" maxLength={2048} value={link.url} required={Boolean(link.nome || link.url)} placeholder="https://…" onChange={event => setValues(current => ({
          ...current,
          redesSociais: current.redesSociais.map((item, itemIndex) => itemIndex === index ? { ...item, url: event.target.value } : item),
        }))} /></label>
        <button className="admin-delete-action" type="button" aria-label={`Remover rede social ${index + 1}`} onClick={() => setValues(current => ({
          ...current, redesSociais: current.redesSociais.filter((_, itemIndex) => itemIndex !== index),
        }))}><Trash2 size={15} aria-hidden="true" /> Remover</button>
      </div>)}
      <button className="admin-secondary-action" type="button" disabled={values.redesSociais.length >= 10} onClick={() => setValues(current => ({
        ...current, redesSociais: [...current.redesSociais, { nome: '', url: '' }],
      }))}><Plus size={15} aria-hidden="true" /> Adicionar rede social</button>
      <small>Adicione até 10 links oficiais. Deixe os campos vazios para não cadastrar uma rede.</small>
    </fieldset>
    {error && <p className="admin-field-wide admin-state-error" role="alert">{error}</p>}
    <div className="admin-form-actions"><button type="button" disabled={saving} onClick={onClose}>Cancelar</button><button type="submit" disabled={saving || !allowed}>{saving ? 'Salvando…' : 'Salvar alterações'}</button></div>
  </form></div>
}
