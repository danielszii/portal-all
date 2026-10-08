import test, { after, type TestContext } from 'node:test'
import assert from 'node:assert/strict'
import { JSDOM } from 'jsdom'
import { act } from 'react'
import { publicAdmin, type AdminProfile } from '../../backend/src/domain/admin-permissions.js'
import type { AdminInstitution } from '../src/services/admin-instituicao.js'

const dom = new JSDOM('<!doctype html><html><body></body></html>', { url: 'http://localhost/admin/instituicao' })
Object.assign(globalThis, { window: dom.window, document: dom.window.document, HTMLElement: dom.window.HTMLElement, IS_REACT_ACT_ENVIRONMENT: true })
const { createRoot } = await import('react-dom/client')
const { createMemoryRouter, RouterProvider } = await import('react-router')
const { AuthProvider } = await import('../src/contexts/AuthContext')
const { default: RequireAuth } = await import('../src/components/RequireAuth')
const { default: AdminInstituicao } = await import('../src/pages/AdminInstituicao')
const { useInstituicao } = await import('../src/hooks/useInstituicao')
const { invalidateInstituicao } = await import('../src/services/api')
after(() => dom.window.close())

const original: AdminInstitution = {
  id: 'all', nome: 'Academia teste', historia: 'História original', missao: 'Missão original', fundacaoAno: 1964,
  email: 'contato@example.test', telefone: '(88) 1234-5678', endereco: 'Endereço original', horarioAtendimento: 'Segunda a sexta',
  sedeTexto: 'Texto da sede', trajetoriaTexto: 'Texto da trajetória', atualizadoEm: '2026-10-01T12:00:00.000Z',
}
function InstitutionObserver() {
  const state = useInstituicao()
  return <output data-testid="shared-contact">{state.data.info?.email}</output>
}
async function mount(t: TestContext, profile: AdminProfile = 'SECRETARIA', initial: AdminInstitution | null = original) {
  invalidateInstituicao()
  let info = initial && { ...initial }
  const controls = { loadStatus: 200, saveStatus: 200, sessionStatus: 200 }
  const writes: { path: string; options: RequestInit; body: Record<string, unknown> }[] = []
  const session = { user: publicAdmin({ id: 'admin', email: 'admin@example.test', perfis: [profile] }), csrfToken: 'a'.repeat(64), expiraEm: new Date(Date.now() + 3600000).toISOString() }
  const fetch = t.mock.method(globalThis, 'fetch', async (path: string, options: RequestInit = {}) => {
    if (path.endsWith('/auth/me')) return controls.sessionStatus === 200 ? Response.json(session) : Response.json({ error: 'Sessão encerrada' }, { status: controls.sessionStatus })
    if (path === '/api/admin/instituicao') {
      if (options.method === 'PUT') {
        const body = JSON.parse(String(options.body)) as Record<string, unknown>
        writes.push({ path, options, body })
        if (controls.saveStatus !== 200) return Response.json({ error: controls.saveStatus === 409 ? 'Este registro foi alterado. Reabra a consulta antes de salvar novamente.' : 'Não foi possível salvar.' }, { status: controls.saveStatus })
        const creating = !info
        info = { ...body, id: 'all', atualizadoEm: '2026-10-08T12:00:00.000Z' } as AdminInstitution
        return Response.json({ info }, { status: creating ? 201 : 200 })
      }
      return controls.loadStatus === 200 ? Response.json({ info }) : Response.json({ error: 'Não foi possível carregar.' }, { status: controls.loadStatus })
    }
    assert.equal(path, '/api/instituicao')
    const { id: _id, atualizadoEm: _version, ...publicInfo } = info ?? {}
    return Response.json({ info: info ? publicInfo : null, gestao: null })
  })
  const container = document.createElement('div'); document.body.append(container)
  const root = createRoot(container)
  const router = createMemoryRouter([
    { Component: RequireAuth, children: [{ path: '/admin/instituicao', Component: AdminInstituicao }] },
    { path: '/login', element: <p>Login necessário</p> },
  ], { initialEntries: ['/admin/instituicao'] })
  t.after(async () => { await act(async () => root.unmount()); router.dispose(); container.remove(); invalidateInstituicao() })
  await act(async () => root.render(<AuthProvider><InstitutionObserver /><RouterProvider router={router} /></AuthProvider>))
  const button = (label: string) => [...container.querySelectorAll<HTMLButtonElement>('button')].find(b => b.textContent?.trim() === label.trim())
  return { container, writes, fetch, controls, setInfo: (value: AdminInstitution) => { info = value }, button,
    open: async () => { const edit = button('Editar dados'); assert.ok(edit, container.textContent ?? 'Página vazia'); await act(async () => edit.click()) },
    submit: async () => { await act(async () => container.querySelector('form')!.dispatchEvent(new dom.window.Event('submit', { bubbles: true, cancelable: true }))) },
  }
}
async function change(container: HTMLElement, name: string, value: string) {
  const field = container.querySelector<HTMLInputElement | HTMLTextAreaElement>(`[name="${name}"]`)!
  const prototype = field.tagName === 'TEXTAREA' ? dom.window.HTMLTextAreaElement.prototype : dom.window.HTMLInputElement.prototype
  await act(async () => {
    Object.getOwnPropertyDescriptor(prototype, 'value')!.set!.call(field, value)
    field.dispatchEvent(new dom.window.Event('input', { bubbles: true }))
  })
}

test('administrador e secretaria editam com dados atuais, versão, CSRF e atualização das outras telas', async t => {
  for (const profile of ['ADMINISTRADOR', 'SECRETARIA'] as const) await t.test(profile, async child => {
    const ui = await mount(child, profile)
    const fresh = { ...original, historia: 'História atualizada por outra pessoa', atualizadoEm: '2026-10-07T10:00:00.000Z' }
    ui.setInfo(fresh)
    await ui.open()
    assert.equal(ui.container.querySelector<HTMLTextAreaElement>('[name="historia"]')!.value, fresh.historia)
    await change(ui.container, 'email', 'novo@example.test')
    await ui.submit()
    assert.equal(ui.writes.length, 1)
    const { id: _id, ...expected } = fresh
    assert.deepEqual(ui.writes[0].body, { ...expected, email: 'novo@example.test' })
    assert.equal(ui.writes[0].options.credentials, 'include')
    assert.equal(new Headers(ui.writes[0].options.headers).get('X-CSRF-Token'), 'a'.repeat(64))
    assert.equal(ui.container.querySelector('[role="dialog"]'), null)
    assert.match(ui.container.textContent!, /salvos e publicados com sucesso/)
    assert.equal(ui.container.querySelector('[data-testid="shared-contact"]')!.textContent, 'novo@example.test')
    assert.match(ui.container.querySelector('.admin-institution-contact-grid')!.textContent!, /novo@example.test/)
  })
})

test('primeiro cadastro envia versão nula e ano opcional vazio como null', async t => {
  const ui = await mount(t, 'SECRETARIA', null)
  await ui.open()
  await change(ui.container, 'nome', 'Academia nova')
  await change(ui.container, 'historia', 'História nova')
  await change(ui.container, 'missao', 'Missão nova')
  await ui.submit()
  assert.equal(ui.writes.length, 1)
  assert.equal(ui.writes[0].body.atualizadoEm, null)
  assert.equal(ui.writes[0].body.fundacaoAno, null)
  assert.match(ui.container.textContent!, /Academia nova/)
})

test('conflito e falha do servidor preservam os ajustes sem confirmar sucesso ou trocar a versão', async t => {
  const ui = await mount(t)
  await ui.open()
  await change(ui.container, 'nome', 'Meu ajuste ainda não salvo')
  for (const status of [409, 500]) {
    ui.controls.saveStatus = status
    await ui.submit()
    assert.equal(ui.container.querySelector<HTMLInputElement>('[name="nome"]')!.value, 'Meu ajuste ainda não salvo')
    assert.ok(ui.container.querySelector('[role="dialog"] [role="alert"]'))
    assert.equal(ui.container.querySelector('.admin-feedback'), null)
    assert.equal(ui.writes.at(-1)!.body.atualizadoEm, original.atualizadoEm)
  }
  assert.equal(ui.writes.length, 2)
})

test('cancelar não grava e erro de carregamento não apresenta formulário vazio', async t => {
  const ui = await mount(t)
  ui.controls.loadStatus = 503
  await ui.open()
  assert.equal(ui.container.querySelector('form'), null)
  assert.ok(ui.container.querySelector('[role="dialog"] [role="alert"]'))
  ui.controls.loadStatus = 200
  await act(async () => ui.button('Tentar novamente')!.click())
  await change(ui.container, 'nome', 'Não salvar')
  await act(async () => ui.button('Cancelar')!.click())
  assert.equal(ui.writes.length, 0)
  assert.equal(ui.container.querySelector('[role="dialog"]'), null)
})

test('campos obrigatórios e ano inválido não são enviados', async t => {
  const ui = await mount(t)
  await ui.open()
  await change(ui.container, 'nome', '   ')
  await ui.submit()
  assert.match(ui.container.querySelector('[role="alert"]')!.textContent!, /Preencha nome/)
  await change(ui.container, 'nome', original.nome)
  await change(ui.container, 'fundacaoAno', '1.5')
  await ui.submit()
  assert.equal(ui.writes.length, 0)
})

test('consulta não recebe edição e editor não acessa a área institucional', async t => {
  for (const profile of ['CONSULTA', 'EDITOR'] as const) await t.test(profile, async child => {
    const ui = await mount(child, profile)
    assert.equal(ui.button(' Editar dados'), undefined)
    assert.equal(ui.container.querySelector('form'), null)
    assert.ok(ui.fetch.mock.calls.every(call => String(call.arguments[0]) !== '/api/admin/instituicao'))
    if (profile === 'EDITOR') assert.match(ui.container.textContent!, /não tem acesso/)
  })
})

test('sessão revogada remove o formulário sem salvar ajustes', async t => {
  const ui = await mount(t)
  await ui.open()
  await change(ui.container, 'missao', 'Ajuste não salvo')
  ui.controls.sessionStatus = 401
  await act(async () => window.dispatchEvent(new dom.window.Event('focus')))
  assert.equal(ui.container.querySelector('[role="dialog"]'), null)
  assert.match(ui.container.textContent!, /Login necessário/)
  assert.equal(ui.writes.length, 0)
})
