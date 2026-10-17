import { useCallback, useState, type FormEvent } from 'react'
import AdminPageHeader from '@/components/admin/AdminPageHeader'
import { useAuth } from '@/contexts/AuthContext'
import { useResource } from '@/hooks/useResource'
import { loadAdminPortal, saveAdminPortal, type AdminPortalContent } from '@/services/admin-portal'

export default function AdminPortal() { return <PortalPage /> }

function PortalPage() {
  const load = useCallback((signal: AbortSignal) => loadAdminPortal(signal), [])
  const state = useResource(load, null)
  return <main className='admin-page'><section className='wrap admin-workspace'>
    <AdminPageHeader title='Conteúdo do' emphasis='portal' description='Edite os textos gerais exibidos nas páginas públicas.' />
    {state.loading && <p className='admin-state'>Carregando conteúdo…</p>}
    {state.error && <p className='admin-state admin-state-error'>{state.error}</p>}
    {state.data && <PortalForm key={state.data.atualizadoEm ?? 'novo'} initial={state.data} onSaved={state.retry} />}
  </section></main>
}

const textFields = [
  ['inicioTitulo', 'Título da página inicial'], ['inicioTexto', 'Apresentação inicial'],
  ['academiaIntroducao', 'Introdução — Academia'], ['cadeirasIntroducao', 'Introdução — Cadeiras'],
  ['acervoIntroducao', 'Introdução — Acervo'], ['agendaIntroducao', 'Introdução — Agenda'],
  ['agendaAviso', 'Aviso da agenda'], ['noticiasIntroducao', 'Introdução — Notícias'],
  ['contatoIntroducao', 'Introdução — Contato'],
] as const

function PortalForm({ initial, onSaved }: { initial: AdminPortalContent; onSaved: () => void }) {
  const { csrfToken, can } = useAuth()
  const [value, setValue] = useState(initial)
  const [subjects, setSubjects] = useState(initial.contatoAssuntos.join('\n'))
  const [status, setStatus] = useState('')
  const [saving, setSaving] = useState(false)
  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (!csrfToken || saving || !can('instituicao:editar')) return
    setSaving(true); setStatus('')
    try {
      await saveAdminPortal({ ...value, contatoAssuntos: subjects.split('\n').map(item => item.trim()).filter(Boolean) }, csrfToken)
      setStatus('Conteúdo salvo e publicado.'); onSaved()
    } catch (error) { setStatus(error instanceof Error ? error.message : 'Não foi possível salvar.') }
    finally { setSaving(false) }
  }
  const slide = (index: number, field: 'title' | 'emphasis' | 'description', text: string) => setValue(current => ({
    ...current, heroSlides: current.heroSlides.map((item, position) => position === index ? { ...item, [field]: text } : item),
  }))
  return <form className='admin-form-panel' onSubmit={submit} aria-busy={saving}>
    <header><h2>Destaques e textos públicos</h2></header>
    <div className='admin-form-content'><div className='admin-form-grid'>
      <label className='admin-field admin-field-wide'><span>Imagem principal (URL)</span><input value={value.heroImagem ?? ''} onChange={event => setValue(current => ({ ...current, heroImagem: event.target.value || null }))} /></label>
      {value.heroSlides.map((item, index) => <fieldset className='admin-field admin-field-wide' key={index}>
        <legend>Destaque {index + 1}</legend>
        <label><span>Título</span><input required value={item.title} onChange={event => slide(index, 'title', event.target.value)} /></label>
        <label><span>Ênfase</span><input required value={item.emphasis} onChange={event => slide(index, 'emphasis', event.target.value)} /></label>
        <label><span>Descrição</span><textarea required rows={3} value={item.description} onChange={event => slide(index, 'description', event.target.value)} /></label>
      </fieldset>)}
      {textFields.map(([name, label]) => <label className='admin-field admin-field-wide' key={name}><span>{label}</span>
        <textarea required rows={name === 'inicioTitulo' ? 2 : 4} value={value[name]} onChange={event => setValue(current => ({ ...current, [name]: event.target.value }))} />
      </label>)}
      <label className='admin-field admin-field-wide'><span>Assuntos do contato (um por linha)</span><textarea required rows={6} value={subjects} onChange={event => setSubjects(event.target.value)} /></label>
      {status && <p className='admin-field-wide admin-feedback' role='status'>{status}</p>}
      <div className='admin-form-actions admin-field-wide'><button type='submit' disabled={saving || !can('instituicao:editar')}>{saving ? 'Salvando…' : 'Salvar e publicar'}</button></div>
    </div></div>
  </form>
}
