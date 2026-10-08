import test, { after, type TestContext } from 'node:test'
import assert from 'node:assert/strict'
import { JSDOM } from 'jsdom'
import { act } from 'react'
import { publicAdmin, type AdminProfile } from '../../backend/src/domain/admin-permissions.js'

const dom = new JSDOM('<!doctype html><html><body></body></html>', { url: 'http://localhost/admin' })
Object.assign(globalThis, { window: dom.window, document: dom.window.document, HTMLElement: dom.window.HTMLElement, IS_REACT_ACT_ENVIRONMENT: true })
const { createRoot } = await import('react-dom/client')
const { createMemoryRouter, RouterProvider } = await import('react-router')
const { AuthProvider } = await import('../src/contexts/AuthContext')
const { default: RequireAuth } = await import('../src/components/RequireAuth')
const { default: Admin } = await import('../src/pages/Admin')
const { default: AdminNoticias } = await import('../src/pages/AdminNoticias')
const { default: AdminContas } = await import('../src/pages/AdminContas')
after(() => dom.window.close())
const record = { id: 1, titulo: 'Teste de acesso', categoria: 'Institucional', lede: 'Resumo', conteudo: 'Texto', status: 'RASCUNHO', atualizadoEm: '2020-01-01T00:00:00.000Z' }

async function mount(t: TestContext, profiles: AdminProfile[], path = '/admin') {
  const session = { user: publicAdmin({ id: 'admin', email: 'admin@example.test', perfis: profiles }), csrfToken: 'a'.repeat(64), expiraEm: new Date(Date.now() + 3600000).toISOString() }
  const writes: { path: string; options?: RequestInit }[] = []
  const fetch = t.mock.method(globalThis, 'fetch', async (url: string, options?: RequestInit) => {
    if (options?.method && options.method !== 'GET') { writes.push({ path: url, options }); return Response.json({ id: 'new' }, { status: 201 }) }
    if (url.endsWith('/auth/me')) return Response.json(session)
    if (url.endsWith('/noticias/1')) return Response.json(record)
    return Response.json({ items: url.includes('/contas') ? [] : [record], page: 1, pageSize: 20, total: 1, totalPages: 1 })
  })
  const container = document.createElement('div'); document.body.append(container)
  const root = createRoot(container)
  const router = createMemoryRouter([
    { Component: RequireAuth, children: [
      { path: '/admin', Component: Admin }, { path: '/admin/noticias', Component: AdminNoticias }, { path: '/admin/contas', Component: AdminContas },
    ] }, { path: '/login', element: <p>Login</p> },
  ], { initialEntries: [path] })
  t.after(async () => { await act(async () => root.unmount()); router.dispose(); container.remove() })
  await act(async () => root.render(<AuthProvider><RouterProvider router={router} /></AuthProvider>))
  return { container, router, session, writes, fetch }
}

test('painel mostra somente módulos permitidos para cada perfil', async t => {
  for (const [profile, paths] of [
    ['ADMINISTRADOR', ['acervo', 'noticias', 'agenda', 'membros', 'auditoria', 'instituicao', 'contas']],
    ['EDITOR', ['acervo', 'noticias', 'agenda']], ['SECRETARIA', ['membros', 'instituicao']],
    ['CONSULTA', ['acervo', 'noticias', 'agenda', 'membros', 'auditoria', 'instituicao']],
  ] as [AdminProfile, string[]][]) {
    await t.test(profile, async child => {
      const { container } = await mount(child, [profile])
      assert.deepEqual([...container.querySelectorAll('.admin-module-card')].map(a => a.getAttribute('href')), paths.map(path => '/admin/' + path))
    })
  }
})

test('URL direta de contas é bloqueada antes de carregar dados para editor', async t => {
  const { container, fetch } = await mount(t, ['EDITOR'], '/admin/contas')
  assert.match(container.textContent!, /não tem acesso/)
  assert.ok(fetch.mock.calls.every(call => String(call.arguments[0]).endsWith('/auth/me')))
})

test('consulta visualiza o registro sem editar, excluir, criar ou enviar formulário', async t => {
  const { container, writes } = await mount(t, ['CONSULTA'], '/admin/noticias')
  assert.equal(container.querySelector('.admin-primary-action'), null)
  assert.equal(container.querySelector('.admin-delete-action'), null)
  const view = container.querySelector<HTMLButtonElement>('.admin-edit-action')!
  assert.match(view.textContent!, /Visualizar/)
  await act(async () => view.click())
  const form = container.querySelector<HTMLFormElement>('[role="dialog"] form')!
  assert.ok(form)
  assert.ok([...form.querySelectorAll<HTMLInputElement>('input, textarea, select')].every(field => field.disabled))
  assert.equal(form.querySelector('button[type="submit"]'), null)
  await act(async () => form.dispatchEvent(new dom.window.Event('submit', { bubbles: true, cancelable: true })))
  assert.equal(writes.length, 0)
})

test('editor tem criação e edição, mas nunca exclusão definitiva', async t => {
  const { container } = await mount(t, ['EDITOR'], '/admin/noticias')
  assert.ok(container.querySelector('.admin-primary-action'))
  assert.match(container.querySelector('.admin-edit-action')!.textContent!, /Editar/)
  assert.equal(container.querySelector('.admin-delete-action'), null)
})

test('administrador cria conta com perfis combinados e CSRF', async t => {
  const { container, writes } = await mount(t, ['ADMINISTRADOR'], '/admin/contas')
  await act(async () => container.querySelector<HTMLButtonElement>('.admin-primary-action')!.click())
  for (const [name, value] of [['email', 'nova@example.test'], ['password', 'Senha nova de teste 2026']]) {
    const field = container.querySelector<HTMLInputElement>(`input[name="${name}"]`)!
    await act(async () => {
      Object.getOwnPropertyDescriptor(dom.window.HTMLInputElement.prototype, 'value')!.set!.call(field, value)
      field.dispatchEvent(new dom.window.Event('input', { bubbles: true }))
    })
  }
  const choices = container.querySelectorAll<HTMLInputElement>('fieldset input')
  await act(async () => { choices[3].click(); choices[1].click(); choices[2].click() })
  const form = container.querySelector('[role="dialog"] form')!
  await act(async () => form.dispatchEvent(new dom.window.Event('submit', { bubbles: true, cancelable: true })))
  assert.equal(writes.length, 1)
  assert.equal(writes[0].path, '/api/admin/contas')
  assert.deepEqual(JSON.parse(String(writes[0].options!.body)), { email: 'nova@example.test', password: 'Senha nova de teste 2026', perfis: ['EDITOR', 'SECRETARIA'] })
  assert.equal(new Headers(writes[0].options!.headers).get('X-CSRF-Token'), 'a'.repeat(64))
  assert.equal(container.querySelector('[role="dialog"]'), null)
})
