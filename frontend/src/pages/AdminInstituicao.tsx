import { useState } from 'react'
import { ArrowLeft, Building2, CalendarDays, Check, Clock3, ExternalLink, FileText, Mail, MapPin, Pencil, Phone, RefreshCw, Settings2, ShieldCheck, Users } from 'lucide-react'
import { NavLink } from 'react-router'
import { useInstituicao } from '@/hooks/useInstituicao'
import { useAuth } from '@/contexts/AuthContext'
import AdminInstitutionEditor from '@/components/admin/AdminInstitutionEditor'
import AdminBoardManager from '@/components/admin/AdminBoardManager'

export default function AdminInstituicao() {
  const state = useInstituicao()
  const { can } = useAuth()
  const [editing, setEditing] = useState(false)
  const [managingBoard, setManagingBoard] = useState(false)
  const [feedback, setFeedback] = useState('')
  const canEdit = can('instituicao:editar')
  const info = state.data.info
  const gestao = state.data.gestao
  const fields = [info?.nome, info?.fundacaoAno, info?.email, info?.telefone, info?.endereco, info?.horarioAtendimento, info?.historia, info?.missao]
  const completed = fields.filter(Boolean).length
  const progress = Math.round(completed / fields.length * 100)
  const contact = [
    { label: 'E-mail institucional', value: info?.email, icon: Mail },
    { label: 'Telefone', value: info?.telefone, icon: Phone },
    { label: 'Endereço', value: info?.endereco, icon: MapPin },
    { label: 'Horário de atendimento', value: info?.horarioAtendimento, icon: Clock3 },
  ]
  const texts = [
    { label: 'História', value: info?.historia },
    { label: 'Missão', value: info?.missao },
    { label: 'Sede', value: info?.sedeTexto },
    { label: 'Trajetória', value: info?.trajetoriaTexto },
  ]

  return <main className="admin-page admin-institution-page">
    <section className="wrap admin-content">
      <div className="admin-page-header admin-institution-header">
        <div>
          <span className="admin-kicker"><Building2 size={15} aria-hidden="true" /> Conteúdo institucional</span>
          <h1>Diretoria e <em>instituição</em></h1>
          <p>Confira os dados apresentados nas páginas públicas do portal.</p>
        </div>
        <div className="admin-header-actions">
          <NavLink className="admin-secondary-action" to="/admin"><ArrowLeft size={15} /> Painel</NavLink>
          {canEdit && <button className="admin-secondary-action" type="button" onClick={() => { setFeedback(''); setEditing(true) }}><Pencil size={15} /> Editar dados</button>}
          {canEdit && <button className="admin-secondary-action" type="button" onClick={() => { setFeedback(''); setManagingBoard(true) }}><Settings2 size={15} /> Gerenciar diretoria</button>}
          <NavLink className="admin-primary-action" to="/academia" target="_blank">Ver página pública <ExternalLink size={14} /></NavLink>
        </div>
      </div>

      {feedback && <p className="admin-feedback" role="status">{feedback}</p>}
      {state.loading && <div className="admin-institution-loading" role="status"><RefreshCw size={20} className="is-spinning" /><span>Carregando informações institucionais…</span></div>}
      {state.error && <div className="admin-state admin-state-error" role="alert"><p>{state.error}</p><button className="filtro-btn" type="button" onClick={state.retry}>Tentar novamente</button></div>}
      {!state.loading && !state.error && <>
        <section className="admin-institution-overview" aria-label="Resumo das informações institucionais">
          <div className="admin-institution-score">
            <div className="admin-score-ring" style={{ '--score': `${progress * 3.6}deg` } as React.CSSProperties}><strong>{progress}%</strong></div>
            <div><span>Completude dos dados</span><p>{completed} de {fields.length} informações essenciais preenchidas</p></div>
          </div>
          <div className="admin-institution-stat"><CalendarDays size={19} /><span>Fundação</span><strong>{info?.fundacaoAno || 'Pendente'}</strong></div>
          <div className="admin-institution-stat"><Users size={19} /><span>Diretoria</span><strong>{gestao?.diretoria.length ?? 0} integrantes</strong></div>
          <div className="admin-institution-stat"><ShieldCheck size={19} /><span>Publicação</span><strong>{info ? 'Ativa' : 'Sem dados'}</strong></div>
        </section>

        <div className="admin-institution-notice" role="note"><ShieldCheck size={18} aria-hidden="true" /><div><strong>{canEdit ? 'Dados institucionais' : 'Consulta institucional'}</strong><p>{canEdit ? 'Use “Editar dados” para atualizar as informações da Academia. As alterações são publicadas ao salvar e registradas no histórico.' : 'Seu perfil permite consultar os dados publicados da instituição.'}</p></div></div>

        <div className="admin-institution-layout">
          <div className="admin-institution-main">
            <section className="admin-institution-panel" aria-labelledby="institution-contact-title">
              <header><div><span>Dados públicos</span><h2 id="institution-contact-title">Identificação e contato</h2></div><Building2 size={20} aria-hidden="true" /></header>
              <div className="admin-institution-identity"><span>Nome oficial</span><strong>{info?.nome || 'Não informado'}</strong></div>
              <div className="admin-institution-contact-grid">{contact.map(({ label, value, icon: Icon }) => <div className={value ? '' : 'is-missing'} key={label}><Icon size={17} aria-hidden="true" /><span>{label}</span><strong>{value || 'Não informado'}</strong>{value && <Check size={13} className="admin-field-check" aria-label="Preenchido" />}</div>)}</div>
            </section>

            <section className="admin-institution-panel" aria-labelledby="institution-text-title">
              <header><div><span>Apresentação pública</span><h2 id="institution-text-title">Conteúdo institucional</h2></div><FileText size={20} aria-hidden="true" /></header>
              <div className="admin-institution-texts">{texts.map(item => <article className={item.value ? '' : 'is-missing'} key={item.label}><div><span>{item.label}</span><small>{item.value ? `${item.value.length} caracteres` : 'Pendente'}</small></div><p>{item.value || 'Este conteúdo ainda não foi informado.'}</p></article>)}</div>
            </section>
          </div>

          <aside className="admin-institution-panel admin-institution-board-panel" aria-labelledby="institution-board-title">
            <header><div><span>Gestão vigente</span><h2 id="institution-board-title">Diretoria</h2></div><Users size={20} aria-hidden="true" /></header>
            {gestao && <div className="admin-board-term"><CalendarDays size={16} /><span>Mandato</span><strong>{gestao.inicioAno} — {gestao.fimAno ?? 'atual'}</strong></div>}
            {gestao?.diretoria.length ? <ol className="admin-institution-board">{gestao.diretoria.map((member, index) => <li key={`${member.cargo}-${member.nome}`}><span>{String(index + 1).padStart(2, '0')}</span><div><small>{member.cargo}</small><strong>{member.nome}</strong><p>Posse em {member.posse}</p></div></li>)}</ol> : <div className="admin-institution-empty"><Users size={24} /><strong>Diretoria não cadastrada</strong><p>Não há integrantes publicados para a gestão vigente.</p></div>}
          </aside>
        </div>
      </>}
    </section>
    {editing && canEdit && <AdminInstitutionEditor onClose={() => setEditing(false)} onSaved={() => { setEditing(false); setFeedback('Dados institucionais salvos e publicados com sucesso.') }} />}
    {managingBoard && canEdit && <AdminBoardManager onClose={() => setManagingBoard(false)} onChanged={message => setFeedback(message)} />}
  </main>
}
