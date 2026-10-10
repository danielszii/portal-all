import { useCallback, useState, type FormEvent, type ReactNode } from 'react'
import { ArrowLeft, Pencil, Plus, Trash2, UserRound, X } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useAdminConfirm } from './AdminConfirmDialog'
import { useDialog } from '@/hooks/useDialog'
import { useResource } from '@/hooks/useResource'
import { AdminApiError, type AdminPage, type PersonRecord } from '@/services/admin'
import { loadAcademicosForBoard, loadGestao, loadGestoes, removeGestao, removeMandato, saveGestao, saveMandato,
  type AdminGestao, type AdminGestaoSummary, type AdminMandato } from '@/services/admin-diretoria'

const emptyBoards: AdminPage<AdminGestaoSummary> = { items: [], total: 0, page: 1, pageSize: 50, totalPages: 1 }
const emptyPeople: AdminPage<PersonRecord> = { items: [], total: 0, page: 1, pageSize: 50, totalPages: 1 }

export default function AdminBoardManager({ onClose, onChanged }: { onClose: () => void; onChanged: (message: string) => void }) {
  const { csrfToken, refresh, can } = useAuth()
  const [selected, setSelected] = useState<AdminGestao | null>(null)
  const [termEditor, setTermEditor] = useState<AdminGestao | 'new' | null>(null)
  const [mandateEditor, setMandateEditor] = useState<AdminMandato | 'new' | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const dialog = useDialog(() => { if (!busy && !termEditor && !mandateEditor) onClose() })
  const confirmation = useAdminConfirm()
  const boards = useResource(useCallback(signal => loadGestoes(signal), []), emptyBoards)
  const people = useResource(useCallback(signal => loadAcademicosForBoard(signal), []), emptyPeople)
  const handleError = (reason: unknown) => {
    setError(reason instanceof Error ? reason.message : 'Não foi possível concluir a operação.')
    if (reason instanceof AdminApiError && [401, 403].includes(reason.status)) void refresh()
  }
  const openBoard = async (id: string) => {
    setBusy(true); setError('')
    try { setSelected(await loadGestao(id)) } catch (reason) { handleError(reason) } finally { setBusy(false) }
  }
  const changed = (message: string, board?: AdminGestao | null) => {
    setSelected(board ?? null); setTermEditor(null); setMandateEditor(null); boards.retry(); onChanged(message)
  }
  const deleteBoard = async () => {
    if (!selected || !csrfToken || selected.mandatos.length) return
    if (!await confirmation.confirm({ title: 'Excluir gestão vazia?', message: `A gestão ${selected.inicioAno}–${selected.fimAno ?? 'atual'} será excluída.`, confirmLabel: 'Excluir gestão', tone: 'danger' })) return
    setBusy(true); setError('')
    try { await removeGestao(selected, csrfToken); changed('Gestão excluída com sucesso.') } catch (reason) { handleError(reason) } finally { setBusy(false) }
  }
  const deleteMandate = async (mandate: AdminMandato) => {
    if (!selected || !csrfToken) return
    if (!await confirmation.confirm({ title: 'Remover integrante?', message: `${mandate.academico.nome} será removido desta gestão. Use apenas para corrigir um cadastro; para sucessões, encerre o período no formulário.`, confirmLabel: 'Remover integrante', tone: 'danger' })) return
    setBusy(true); setError('')
    try { changed('Integrante removido da gestão.', await removeMandato(selected, mandate.id, csrfToken)) } catch (reason) { handleError(reason) } finally { setBusy(false) }
  }

  return <><div className="admin-form-overlay">
    <div ref={dialog} tabIndex={-1} className="admin-form-panel admin-board-manager" role="dialog" aria-modal="true" aria-labelledby="board-manager-title">
      <header>
        <div><span>Conteúdo institucional</span><h2 id="board-manager-title">Gestões e diretoria</h2></div>
        <button type="button" disabled={busy} onClick={onClose} aria-label="Fechar gestão da diretoria"><X size={19} /></button>
      </header>
      <div className="admin-board-manager-body">
        {error && <p className="admin-state admin-state-error" role="alert">{error}</p>}
        {!selected ? <>
          <div className="admin-board-toolbar"><p>Cadastre os períodos e depois inclua os integrantes de cada diretoria.</p><button className="admin-primary-action" type="button" onClick={() => setTermEditor('new')}><Plus size={15} /> Nova gestão</button></div>
          {boards.loading && <p className="admin-state" role="status">Carregando gestões…</p>}
          {boards.error && <div className="admin-state admin-state-error" role="alert"><p>{boards.error}</p><button type="button" className="filtro-btn" onClick={boards.retry}>Tentar novamente</button></div>}
          {!boards.loading && !boards.error && !boards.data.items.length && <p className="admin-state">Nenhuma gestão cadastrada.</p>}
          <div className="admin-record-list">{boards.data.items.map(board => <article className="admin-record" key={board.id}>
            <div><h3>Gestão {board.inicioAno} — {board.fimAno ?? 'atual'}</h3><p>{board._count.mandatos} integrante{board._count.mandatos !== 1 ? 's' : ''} no histórico</p></div>
            <div className="admin-record-actions"><button className="admin-edit-action" type="button" disabled={busy} onClick={() => void openBoard(board.id)}><Pencil size={14} /> Gerenciar</button></div>
          </article>)}</div>
        </> : <>
          <div className="admin-board-toolbar">
            <button className="admin-secondary-action" type="button" onClick={() => { setSelected(null); setError('') }}><ArrowLeft size={15} /> Todas as gestões</button>
            <div><strong>Gestão {selected.inicioAno} — {selected.fimAno ?? 'atual'}</strong><span>{selected.mandatos.length} integrante{selected.mandatos.length !== 1 ? 's' : ''}</span></div>
            <button className="admin-secondary-action" type="button" onClick={() => setTermEditor(selected)}><Pencil size={14} /> Editar período</button>
            <button className="admin-primary-action" type="button" disabled={people.loading || Boolean(people.error)} onClick={() => setMandateEditor('new')}><Plus size={14} /> Integrante</button>
          </div>
          {people.error && <div className="admin-state admin-state-error" role="alert"><p>Não foi possível carregar os acadêmicos disponíveis.</p><button className="filtro-btn" type="button" onClick={people.retry}>Tentar novamente</button></div>}
          {!selected.mandatos.length && <div className="admin-board-empty"><UserRound size={22} /><p>Esta gestão ainda não possui integrantes.</p>{can('registros:excluir') && <button className="admin-delete-action" type="button" onClick={() => void deleteBoard()}><Trash2 size={14} /> Excluir gestão vazia</button>}</div>}
          <div className="admin-record-list">{selected.mandatos.map(mandate => <article className="admin-record" key={mandate.id}>
            <div><h3>{mandate.academico.nome}</h3><p>{mandate.cargo} · {dateLabel(mandate.inicioEm) || selected.inicioAno} até {dateLabel(mandate.fimEm) || selected.fimAno || 'atual'}</p></div>
            <div className="admin-record-actions"><button className="admin-edit-action" type="button" onClick={() => setMandateEditor(mandate)}><Pencil size={14} /> Editar</button>{can('registros:excluir') && <button className="admin-delete-action" type="button" onClick={() => void deleteMandate(mandate)}><Trash2 size={14} /> Remover</button>}</div>
          </article>)}</div>
        </>}
      </div>
    </div>
  </div>
  {termEditor && <TermEditor current={termEditor === 'new' ? null : termEditor} csrfToken={csrfToken} onClose={() => setTermEditor(null)} onError={handleError} onSaved={board => changed(termEditor === 'new' ? 'Gestão criada com sucesso.' : 'Período da gestão atualizado.', board)} />}
  {mandateEditor && selected && <MandateEditor current={mandateEditor === 'new' ? null : mandateEditor} board={selected} people={people.data.items} csrfToken={csrfToken} onClose={() => setMandateEditor(null)} onError={handleError} onSaved={board => changed(mandateEditor === 'new' ? 'Integrante incluído na diretoria.' : 'Mandato atualizado.', board)} />}
  {confirmation.dialog}</>
}

function dateLabel(value: string | null) { return value ? new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC' }).format(new Date(`${value.slice(0, 10)}T00:00:00Z`)) : '' }

function TermEditor({ current, csrfToken, onClose, onError, onSaved }: { current: AdminGestao | null; csrfToken: string | null; onClose: () => void; onError: (error: unknown) => void; onSaved: (board: AdminGestao) => void }) {
  const year = new Date().getFullYear()
  const [start, setStart] = useState(String(current?.inicioAno ?? year))
  const [end, setEnd] = useState(current?.fimAno == null ? '' : String(current.fimAno))
  const [saving, setSaving] = useState(false)
  const submit = async (event: FormEvent) => { event.preventDefault(); if (!csrfToken || saving) return; setSaving(true)
    try { onSaved(await saveGestao({ inicioAno: Number(start), fimAno: end ? Number(end) : null }, csrfToken, current ?? undefined)) } catch (reason) { onError(reason) } finally { setSaving(false) }
  }
  return <NestedForm title={current ? 'Editar período' : 'Nova gestão'} onClose={onClose} busy={saving}><form onSubmit={submit}>
    <label className="admin-field"><span>Ano inicial</span><input type="number" min="1" max="9999" required value={start} onChange={event => setStart(event.target.value)} /></label>
    <label className="admin-field"><span>Ano final (opcional)</span><input type="number" min={Number(start) || 1} max="9999" value={end} onChange={event => setEnd(event.target.value)} /></label>
    <div className="admin-form-actions admin-field-wide"><button type="button" onClick={onClose}>Cancelar</button><button type="submit" disabled={saving}>{saving ? 'Salvando…' : 'Salvar período'}</button></div>
  </form></NestedForm>
}

function MandateEditor({ current, board, people, csrfToken, onClose, onError, onSaved }: { current: AdminMandato | null; board: AdminGestao; people: PersonRecord[]; csrfToken: string | null; onClose: () => void; onError: (error: unknown) => void; onSaved: (board: AdminGestao) => void }) {
  const [person, setPerson] = useState(current?.academicoId ?? '')
  const [role, setRole] = useState(current?.cargo ?? '')
  const [start, setStart] = useState(current?.inicioEm?.slice(0, 10) ?? '')
  const [end, setEnd] = useState(current?.fimEm?.slice(0, 10) ?? '')
  const [saving, setSaving] = useState(false)
  const options = current && !people.some(item => item.id === current.academico.id) ? [current.academico, ...people] : people
  const submit = async (event: FormEvent) => { event.preventDefault(); if (!csrfToken || saving) return; setSaving(true)
    try { onSaved(await saveMandato(board, { academicoId: person, cargo: role, inicioEm: start || null, fimEm: end || null }, csrfToken, current?.id)) } catch (reason) { onError(reason) } finally { setSaving(false) }
  }
  return <NestedForm title={current ? 'Editar integrante' : 'Adicionar integrante'} onClose={onClose} busy={saving}><form onSubmit={submit}>
    <label className="admin-field admin-field-wide"><span>Acadêmico</span><select required value={person} onChange={event => setPerson(event.target.value)}><option value="" disabled>Selecione</option>{options.map(item => <option key={item.id} value={item.id}>{item.nome}{item.inMemoriam ? ' — in memoriam' : ''}</option>)}</select><small>O acadêmico precisa estar cadastrado anteriormente no quadro de membros.</small></label>
    <label className="admin-field admin-field-wide"><span>Cargo</span><input required maxLength={100} value={role} onChange={event => setRole(event.target.value)} placeholder="Ex.: Presidente" /></label>
    <label className="admin-field"><span>Início no cargo (opcional)</span><input type="date" value={start} onChange={event => setStart(event.target.value)} /></label>
    <label className="admin-field"><span>Fim no cargo (opcional)</span><input type="date" min={start || undefined} value={end} onChange={event => setEnd(event.target.value)} /></label>
    <div className="admin-form-actions admin-field-wide"><button type="button" onClick={onClose}>Cancelar</button><button type="submit" disabled={saving}>{saving ? 'Salvando…' : 'Salvar integrante'}</button></div>
  </form></NestedForm>
}

function NestedForm({ title, busy, onClose, children }: { title: string; busy: boolean; onClose: () => void; children: ReactNode }) {
  const dialog = useDialog(() => { if (!busy) onClose() })
  return <div className="admin-form-overlay admin-nested-overlay"><div ref={dialog} tabIndex={-1} className="admin-form-panel admin-board-editor" role="dialog" aria-modal="true" aria-labelledby="board-editor-title"><header><div><span>Diretoria</span><h2 id="board-editor-title">{title}</h2></div><button type="button" disabled={busy} onClick={onClose} aria-label="Fechar formulário"><X size={19} /></button></header><div className="admin-form-content">{children}</div></div></div>
}
