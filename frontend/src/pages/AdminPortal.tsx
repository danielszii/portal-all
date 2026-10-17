import { useCallback, useState, type FormEvent } from 'react'
import { ArrowLeft, ArrowRight, Check, Image, LayoutTemplate, Save, TextCursorInput } from 'lucide-react'
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
const pages = [
  { title: 'Destaques da página inicial', description: 'Imagem principal e mensagens do carrossel.', icon: Image },
  { title: 'Apresentação das páginas', description: 'Textos de abertura da página inicial e das áreas institucionais.', icon: LayoutTemplate },
  { title: 'Agenda, notícias e contato', description: 'Avisos, introduções e opções do formulário de contato.', icon: TextCursorInput },
]

function PortalForm({ initial, onSaved }: { initial: AdminPortalContent; onSaved: () => void }) {
  const { csrfToken, can } = useAuth()
  const [value, setValue] = useState(initial)
  const [subjects, setSubjects] = useState(initial.contatoAssuntos.join('\n'))
  const [status, setStatus] = useState('')
  const [saving, setSaving] = useState(false)
  const [page, setPage] = useState(1)
  const pageInfo = pages[page - 1]
  const PageIcon = pageInfo.icon
  const visibleFields = page === 2 ? textFields.slice(0, 5) : textFields.slice(5)
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
  return <form className='admin-portal-editor' onSubmit={submit} aria-busy={saving}>
    <nav className='admin-portal-steps' aria-label='Etapas da edição'>
      {pages.map((item, index) => { const Icon = item.icon; const number = index + 1; return <button type='button' className={page === number ? 'is-active' : page > number ? 'is-complete' : ''} aria-current={page === number ? 'step' : undefined} onClick={() => setPage(number)} key={item.title}><span>{page > number ? <Check size={15} /> : number}</span><Icon size={18} /><strong>{item.title}</strong></button> })}
    </nav>
    <section className='admin-portal-card' data-pagination-start>
      <header><div className='admin-portal-card-icon'><PageIcon size={22} /></div><div><span>Etapa {page} de {pages.length}</span><h2>{pageInfo.title}</h2><p>{pageInfo.description}</p></div></header>
      <div className='admin-portal-fields'>
      {page === 1 && <><label className='admin-field admin-field-wide'><span>Imagem principal (URL)</span><input value={value.heroImagem ?? ''} onChange={event => setValue(current => ({ ...current, heroImagem: event.target.value || null }))} /></label>
      {value.heroSlides.map((item, index) => <fieldset className='admin-field admin-field-wide' key={index}>
        <legend>Destaque {index + 1}</legend>
        <label><span>Título</span><input required value={item.title} onChange={event => slide(index, 'title', event.target.value)} /></label>
        <label><span>Ênfase</span><input required value={item.emphasis} onChange={event => slide(index, 'emphasis', event.target.value)} /></label>
        <label><span>Descrição</span><textarea required rows={3} value={item.description} onChange={event => slide(index, 'description', event.target.value)} /></label>
      </fieldset>)}</>}
      {page > 1 && visibleFields.map(([name, label]) => <label className='admin-field admin-field-wide' key={name}><span>{label}</span>
        <textarea required rows={name === 'inicioTitulo' ? 2 : 4} value={value[name]} onChange={event => setValue(current => ({ ...current, [name]: event.target.value }))} />
      </label>)}
      {page === 3 && <label className='admin-field admin-field-wide'><span>Assuntos do contato (um por linha)</span><small>Essas opções aparecem para o visitante no formulário público.</small><textarea required rows={6} value={subjects} onChange={event => setSubjects(event.target.value)} /></label>}
      {status && <p className='admin-field-wide admin-feedback' role='status'>{status}</p>}
      </div>
      <footer className='admin-portal-footer'>
        <button className='admin-secondary-action' type='button' disabled={page === 1} onClick={() => setPage(current => current - 1)}><ArrowLeft size={15} /> Anterior</button>
        <span><strong>{page}</strong> de {pages.length}</span>
        {page < pages.length ? <button className='admin-primary-action' type='button' onClick={() => setPage(current => current + 1)}>Próxima <ArrowRight size={15} /></button> : <button className='admin-primary-action' type='submit' disabled={saving || !can('instituicao:editar')}><Save size={15} /> {saving ? 'Salvando…' : 'Salvar e publicar'}</button>}
      </footer>
    </section>
  </form>
}
