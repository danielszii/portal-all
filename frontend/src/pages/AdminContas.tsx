import { useCallback, useRef, useState } from 'react'
import { ArrowLeft, Pencil, Plus, X } from 'lucide-react'
import { NavLink } from 'react-router'
import { useAuth } from '@/contexts/AuthContext'
import { useResource } from '@/hooks/useResource'
import { useDialog } from '@/hooks/useDialog'
import Pagination from '@/components/Pagination'
import { adminRequest, AdminApiError, type AdminPage } from '@/services/admin'
import { adminProfiles, profileLabels, type AdminProfile } from '@/services/admin-permissions'

type Account = { id: string; email: string; perfis: AdminProfile[]; ativo: boolean; atualizadoEm: string }
const empty: AdminPage<Account> = { items: [], total: 0, page: 1, pageSize: 20, totalPages: 1 }
const profileDescriptions: Record<AdminProfile, string> = {
  ADMINISTRADOR: 'Gerencia todas as áreas, contas e permissões.',
  EDITOR: 'Publica e edita notícias, eventos e acervo; envia imagens e PDFs.',
  SECRETARIA: 'Gerencia membros, cadeiras, instituição e diretoria; envia imagens.',
  CONSULTA: 'Consulta conteúdos, dados institucionais e histórico de alterações.',
}

export default function AdminContas() {
  const { refresh } = useAuth()
  const [page, setPage] = useState(1)
  const [editor, setEditor] = useState<{ account: Account | null } | null>(null)
  const [feedback, setFeedback] = useState('')
  const load = useCallback(async (signal: AbortSignal) => {
    try { return await adminRequest<AdminPage<Account>>(`/contas?page=${page}`, { signal }) }
    catch (error) { if (error instanceof AdminApiError && [401, 403].includes(error.status)) void refresh(); throw error }
  }, [page, refresh])
  const state = useResource(load, empty)
  return <main className="admin-page admin-workspace-page">
    <div className="wrap admin-workspace">
      <header className="admin-workspace-header">
        <div><h1>Gerenciar <em>contas</em></h1><p>Escolha os perfis de cada pessoa. Contas desativadas preservam o histórico de alterações.</p></div>
        <div className="admin-header-actions">
          <NavLink className="admin-secondary-action" to="/admin"><ArrowLeft size={15} /> Voltar ao painel</NavLink>
          <button className="admin-primary-action" type="button" onClick={() => { setFeedback(''); setEditor({ account: null }) }}><Plus size={16} /> Nova conta</button>
        </div>
      </header>
      {feedback && <p className="admin-feedback" role="status">{feedback}</p>}
      <section className="admin-management" aria-label="Contas administrativas">
        {state.loading && <p className="admin-state" role="status">Carregando contas…</p>}
        {state.error && <div className="admin-state admin-state-error" role="alert"><p>{state.error}</p><button className="filtro-btn" type="button" onClick={state.retry}>Tentar novamente</button></div>}
        {!state.loading && !state.error && <>
          <div className="admin-record-list">{state.data.items.map(account => <article className="admin-record" key={account.id}>
            <div><h2>{account.email}</h2><p>{account.perfis.map(profile => profileLabels[profile]).join(' · ')}</p></div>
            <span>{account.ativo ? 'Ativa' : 'Desativada'}</span>
            <button className="admin-edit-action" type="button" onClick={() => { setFeedback(''); setEditor({ account }) }}><Pencil size={14} /> Editar</button>
          </article>)}</div>
          <Pagination page={state.data.page} totalPages={state.data.totalPages} onChange={setPage} />
        </>}
      </section>
    </div>
    {editor && <AccountEditor account={editor.account} onClose={() => setEditor(null)} onSaved={() => { setEditor(null); setFeedback('Conta salva. Alterações de acesso encerram as sessões da conta.'); state.retry() }} />}
  </main>
}

function AccountEditor({ account, onClose, onSaved }: { account: Account | null; onClose: () => void; onSaved: () => void }) {
  const { csrfToken, user, can, refresh } = useAuth()
  const [email, setEmail] = useState(account?.email ?? '')
  const [password, setPassword] = useState('')
  const [perfis, setPerfis] = useState<AdminProfile[]>(account?.perfis ?? ['CONSULTA'])
  const [ativo, setAtivo] = useState(account?.ativo ?? true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const lock = useRef(false)
  const dialog = useDialog(() => { if (!lock.current) onClose() })
  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!csrfToken || !can('contas:gerenciar') || lock.current) return
    if (!perfis.length) { setError('Selecione ao menos um perfil.'); return }
    lock.current = true; setSaving(true); setError('')
    try {
      await adminRequest(account ? `/contas/${encodeURIComponent(account.id)}` : '/contas', {
        method: account ? 'PUT' : 'POST', csrfToken,
        body: account ? { perfis, ativo, atualizadoEm: account.atualizadoEm, ...(password && { password }) } : { email, password, perfis },
      })
      setPassword('')
      onSaved()
      if (account?.id === user?.id) void refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível salvar a conta.')
      if (err instanceof AdminApiError && [401, 403].includes(err.status)) void refresh()
    } finally { lock.current = false; setSaving(false) }
  }
  return <div className="admin-form-overlay">
    <div ref={dialog} tabIndex={-1} className="admin-form-panel" role="dialog" aria-modal="true" aria-labelledby="account-form-title">
      <header><h2 id="account-form-title">{account ? 'Editar conta' : 'Nova conta'}</h2><button type="button" disabled={saving} onClick={onClose} aria-label="Fechar formulário"><X size={19} /></button></header>
      <div className="admin-form-content"><form onSubmit={submit} aria-busy={saving}>
        <label className="admin-field admin-field-wide"><span>E-mail</span><input name="email" type="email" required maxLength={254} disabled={saving || account !== null} value={email} onChange={event => setEmail(event.target.value)} autoComplete="off" /></label>
        <label className="admin-field admin-field-wide"><span>{account ? 'Nova senha (opcional)' : 'Senha inicial'}</span><input name="password" type="password" required={!account} minLength={15} maxLength={128} disabled={saving} value={password} onChange={event => setPassword(event.target.value)} autoComplete="new-password" /><small>De 15 a 128 caracteres. Compartilhe a senha diretamente com o titular.</small></label>
        <fieldset className="admin-field-wide" disabled={saving}>
          <legend>Perfis de acesso</legend>
          {adminProfiles.map(profile => <div className="admin-profile-option" key={profile}>
            <label className="admin-account-option"><input type="checkbox" aria-describedby={`profile-${profile}-description`} checked={perfis.includes(profile)} onChange={event => setPerfis(current => event.target.checked ? [...current, profile] : current.filter(value => value !== profile))} /> {profileLabels[profile]}</label>
            <p className="admin-profile-description" id={`profile-${profile}-description`}>{profileDescriptions[profile]}</p>
          </div>)}
          <small>Perfis podem ser combinados.</small>
        </fieldset>
        {account && <label className="admin-field-wide admin-account-option"><input type="checkbox" checked={ativo} disabled={saving} onChange={event => setAtivo(event.target.checked)} /> Conta ativa</label>}
        {account?.id === user?.id && <p className="admin-field-wide">Alterar seu próprio acesso ou senha exigirá entrar novamente.</p>}
        {error && <p className="admin-field-wide admin-state-error" role="alert">{error}</p>}
        <div className="admin-form-actions"><button type="button" disabled={saving} onClick={onClose}>Cancelar</button><button type="submit" disabled={saving}>{saving ? 'Salvando…' : 'Salvar'}</button></div>
      </form></div>
    </div>
  </div>
}
