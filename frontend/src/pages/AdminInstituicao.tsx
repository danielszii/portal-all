import { useState } from 'react'
import { Building2, CalendarDays, Clock3, ExternalLink, FileText, Mail, MapPin, Pencil, Phone, RefreshCw, Settings2, Users } from 'lucide-react'
import { NavLink } from 'react-router'
import { useInstituicao } from '@/hooks/useInstituicao'
import { useAuth } from '@/contexts/AuthContext'
import AdminInstitutionEditor from '@/components/admin/AdminInstitutionEditor'
import AdminBoardManager from '@/components/admin/AdminBoardManager'
import AdminPageHeader from '@/components/admin/AdminPageHeader'

const conselhos = [
  { id: 'DIRETOR', nome: 'Conselho Diretor' },
  { id: 'CONSULTIVO', nome: 'Conselho Consultivo' },
  { id: 'FISCAL', nome: 'Conselho Fiscal' },
] as const

export default function AdminInstituicao() {
  const state = useInstituicao()
  const { can } = useAuth()
  const [editing, setEditing] = useState(false)
  const [managingBoard, setManagingBoard] = useState(false)
  const [feedback, setFeedback] = useState('')
  const canEdit = can('instituicao:editar')
  const info = state.data.info
  const gestao = state.data.gestao
  const contact = [
    { label: 'E-mail', value: info?.email, icon: Mail },
    { label: 'Telefone', value: info?.telefone, icon: Phone },
    { label: 'Endereço', value: info?.endereco, icon: MapPin },
    { label: 'Atendimento', value: info?.horarioAtendimento, icon: Clock3 },
  ]
  const texts = [
    { label: 'História', value: info?.historia },
    { label: 'Missão', value: info?.missao },
    { label: 'Sede', value: info?.sedeTexto },
    { label: 'Trajetória', value: info?.trajetoriaTexto },
  ]

  return <main className="admin-page admin-institution-page">
    <section className="wrap admin-workspace">
      <AdminPageHeader title="Diretoria e" emphasis="instituição" description="Consulte os dados publicados e organize a composição dos conselhos.">
        <NavLink className="admin-secondary-action" to="/academia" target="_blank" rel="noopener noreferrer">Ver página pública <ExternalLink size={14} aria-hidden="true" /></NavLink>
        {canEdit && <button className="admin-secondary-action" type="button" onClick={() => { setFeedback(''); setManagingBoard(true) }}><Settings2 size={15} aria-hidden="true" /> Gerenciar conselhos</button>}
        {canEdit && <button className="admin-primary-action" type="button" onClick={() => { setFeedback(''); setEditing(true) }}><Pencil size={15} aria-hidden="true" /> Editar instituição</button>}
      </AdminPageHeader>

      {feedback && <p className="admin-feedback" role="status">{feedback}</p>}
      {state.loading && <div className="admin-institution-loading" role="status"><RefreshCw size={20} className="is-spinning" /><span>Carregando informações institucionais…</span></div>}
      {state.error && <div className="admin-state admin-state-error" role="alert"><p>{state.error}</p><button className="filtro-btn" type="button" onClick={state.retry}>Tentar novamente</button></div>}

      {!state.loading && !state.error && <>
        <section className="admin-institution-summary" aria-label="Resumo institucional">
          <div><Building2 size={18} aria-hidden="true" /><span>Instituição</span><strong>{info?.nome || 'Não informada'}</strong></div>
          <div><CalendarDays size={18} aria-hidden="true" /><span>Fundação</span><strong>{info?.fundacaoAno || 'Não informada'}</strong></div>
          <div><Users size={18} aria-hidden="true" /><span>Gestão vigente</span><strong>{gestao ? `${gestao.inicioAno} — ${gestao.fimAno ?? 'atual'}` : 'Não cadastrada'}</strong></div>
        </section>

        <div className="admin-institution-clean-layout">
          <div className="admin-institution-clean-main">
            <section className="admin-clean-panel" aria-labelledby="institution-contact-title">
              <header><div><span>Dados públicos</span><h2 id="institution-contact-title">Identificação e contato</h2></div><Building2 size={19} aria-hidden="true" /></header>
              <div className="admin-clean-contact-list">{contact.map(({ label, value, icon: Icon }) => <div key={label}><Icon size={16} aria-hidden="true" /><span>{label}</span><strong className={value ? '' : 'is-missing'}>{value || 'Não informado'}</strong></div>)}</div>
            </section>

            <section className="admin-clean-panel" aria-labelledby="institution-content-title">
              <header><div><span>Conteúdo do portal</span><h2 id="institution-content-title">Textos institucionais</h2></div><FileText size={19} aria-hidden="true" /></header>
              <div className="admin-clean-content-list">{texts.map(item => <article key={item.label}><div><strong>{item.label}</strong><span className={item.value ? 'is-ready' : ''}>{item.value ? 'Preenchido' : 'Pendente'}</span></div><p>{item.value || 'Conteúdo ainda não informado.'}</p></article>)}</div>
            </section>
          </div>

          <aside className="admin-clean-panel admin-clean-board" aria-labelledby="institution-board-title">
            <header><div><span>Composição atual</span><h2 id="institution-board-title">Conselhos</h2></div><Users size={19} aria-hidden="true" /></header>
            {!gestao?.diretoria.length && <div className="admin-institution-empty"><Users size={22} /><strong>Nenhum integrante</strong><p>Cadastre a gestão e os integrantes dos conselhos.</p></div>}
            {Boolean(gestao?.diretoria.length) && <div className="admin-clean-councils">{conselhos.map(conselho => {
              const members = gestao!.diretoria.filter(member => (member.conselho ?? 'DIRETOR') === conselho.id)
              return <section key={conselho.id}>
                <div className="admin-clean-council-title"><h3>{conselho.nome}</h3><span>{members.length}</span></div>
                {members.length ? <ul>{members.map(member => <li key={`${member.nome}-${member.cargo ?? 'integrante'}`}><strong>{member.nome}</strong>{member.cargo && <span>{member.cargo}</span>}</li>)}</ul> : <p>Nenhum integrante cadastrado.</p>}
              </section>
            })}</div>}
          </aside>
        </div>
      </>}
    </section>

    {editing && canEdit && <AdminInstitutionEditor onClose={() => setEditing(false)} onSaved={() => { setEditing(false); setFeedback('Dados institucionais salvos e publicados com sucesso.') }} />}
    {managingBoard && canEdit && <AdminBoardManager onClose={() => setManagingBoard(false)} onChanged={message => { setFeedback(message); state.retry() }} />}
  </main>
}
