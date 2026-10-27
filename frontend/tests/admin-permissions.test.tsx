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
const { default: AdminAgenda } = await import('../src/pages/AdminAgenda')
const { default: AdminAcervo } = await import('../src/pages/AdminAcervo')
const { default: AdminPortal } = await import('../src/pages/AdminPortal')
const { default: AdminContas } = await import('../src/pages/AdminContas')
after(() => dom.window.close())
const record = { id: 1, titulo: 'Teste de acesso', categoria: 'Institucional', lede: 'Resumo', conteudo: 'Texto', status: 'RASCUNHO', atualizadoEm: '2020-01-01T00:00:00.000Z' }
const account = { id: 'other-admin', email: 'outra@example.test', perfis: ['CONSULTA'] as AdminProfile[], ativo: true, atualizadoEm: '2026-10-01T12:00:00.000Z' }
const portal = {
  id: 'portal', heroSlides: [
    { title: 'Destaque', emphasis: 'em ênfase', description: 'Descrição' },
    { title: 'Outro destaque', emphasis: 'em ênfase', description: 'Descrição' },
    { title: 'Terceiro destaque', emphasis: 'em ênfase', description: 'Descrição' },
  ], heroImagem: null, inicioTitulo: 'Título inicial', inicioTexto: 'Texto inicial',
  academiaIntroducao: 'Introdução academia', cadeirasIntroducao: 'Introdução cadeiras',
  acervoIntroducao: 'Introdução acervo', agendaIntroducao: 'Introdução agenda', agendaAviso: 'Aviso agenda',
  noticiasIntroducao: 'Introdução notícias', contatoIntroducao: 'Introdução contato',
  contatoAssuntos: ['Informações institucionais'], atualizadoEm: '2026-10-01T12:00:00.000Z',
}

async function mount(t: TestContext, profiles: AdminProfile[], path = '/admin', accounts = [] as typeof account[], portalLoadStatus = 200) {
  const session = { user: publicAdmin({ id: 'admin', email: 'admin@example.test', perfis: profiles }), csrfToken: 'a'.repeat(64), expiraEm: new Date(Date.now() + 3600000).toISOString() }
  const writes: { path: string; options?: RequestInit }[] = []
  const controls = { portalLoadStatus }
  const fetch = t.mock.method(globalThis, 'fetch', async (url: string, options?: RequestInit) => {
    if (options?.method && options.method !== 'GET') { writes.push({ path: url, options }); return Response.json({ id: 'new' }, { status: 201 }) }
    if (url.endsWith('/auth/me')) return Response.json(session)
    if (url.endsWith('/admin/portal')) return controls.portalLoadStatus === 200 ? Response.json(portal) : Response.json({ error: 'Falha ao carregar portal.' }, { status: controls.portalLoadStatus })
    if (url.endsWith('/noticias/1')) return Response.json(record)
    const items = url.includes('/contas') ? accounts : [record]
    return Response.json({ items, page: 1, pageSize: 20, total: items.length, totalPages: 1 })
  })
  const container = document.createElement('div'); document.body.append(container)
  const root = createRoot(container)
  const router = createMemoryRouter([
    { Component: RequireAuth, children: [
      { path: '/admin', Component: Admin }, { path: '/admin/noticias', Component: AdminNoticias }, { path: '/admin/contas', Component: AdminContas },
      { path: '/admin/agenda', Component: AdminAgenda }, { path: '/admin/acervo', Component: AdminAcervo }, { path: '/admin/portal', Component: AdminPortal },
    ] }, { path: '/login', element: <p>Login</p> },
  ], { initialEntries: [path] })
  t.after(async () => { await act(async () => root.unmount()); router.dispose(); container.remove() })
  await act(async () => root.render(<AuthProvider><RouterProvider router={router} /></AuthProvider>))
  return { container, router, session, writes, fetch, controls }
}

test('painel mostra somente módulos permitidos para cada perfil', async t => {
  for (const [profile, paths] of [
    ['ADMINISTRADOR', ['acervo', 'noticias', 'agenda', 'membros', 'auditoria', 'instituicao', 'contas', 'portal']],
    ['EDITOR', ['acervo', 'noticias', 'agenda']], ['SECRETARIA', ['membros', 'instituicao', 'portal']],
    ['CONSULTA', ['acervo', 'noticias', 'agenda', 'membros', 'auditoria', 'instituicao', 'portal']],
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

test('publicação oferece capa colorida, página do PDF e envio de imagem', async t => {
  const { container } = await mount(t, ['EDITOR'], '/admin/acervo')
  await act(async () => container.querySelector<HTMLButtonElement>('.admin-primary-action')!.click())
  const choices = [...container.querySelectorAll<HTMLLabelElement>('.cover-choice-options label')]
  assert.deepEqual(choices.map(choice => choice.textContent?.trim()), ['Usar capa colorida', 'Escolher página do PDF', 'Enviar imagem de capa'])
  await act(async () => choices[2].querySelector('input')!.click())
  assert.equal(container.querySelector<HTMLInputElement>('input[accept="image/*"]')?.type, 'file')
  assert.equal(container.querySelector<HTMLButtonElement>('.admin-form-actions button[type="submit"]')?.disabled, true)
  await act(async () => choices[0].querySelector('input')!.click())
  assert.equal(container.querySelector<HTMLInputElement>('input[accept="image/*"]'), null)
  assert.equal(container.querySelector<HTMLButtonElement>('.admin-form-actions button[type="submit"]')?.disabled, false)
})

test('tipo de publicação permite selecionar matéria ou digitar um tipo personalizado', async t => {
  const { container } = await mount(t, ['EDITOR'], '/admin/acervo')
  await act(async () => container.querySelector<HTMLButtonElement>('.admin-primary-action')!.click())
  const select = container.querySelector<HTMLSelectElement>('select[name="categoriaSelecao"]')!
  assert.ok([...select.options].some(option => option.value === 'Matéria'))
  await act(async () => { select.value = '__custom__'; select.dispatchEvent(new dom.window.Event('change', { bubbles: true })) })
  const input = container.querySelector<HTMLInputElement>('input[name="categoria"]')!
  assert.ok(input.required)
  await act(async () => {
    Object.getOwnPropertyDescriptor(dom.window.HTMLInputElement.prototype, 'value')!.set!.call(input, 'Manuscrito')
    input.dispatchEvent(new dom.window.Event('input', { bubbles: true }))
  })
  assert.match(container.querySelector('.admin-preview-meta')?.textContent ?? '', /Manuscrito/)
  await act(async () => { select.value = 'Matéria'; select.dispatchEvent(new dom.window.Event('change', { bubbles: true })) })
  assert.equal(container.querySelector('input[name="categoria"]'), null)
  assert.match(container.querySelector('.admin-preview-meta')?.textContent ?? '', /Matéria/)
})

test('novos conteúdos começam publicados e exigem confirmação antes de serem enviados', async t => {
  for (const resource of ['noticias', 'agenda', 'acervo']) {
    await t.test(resource, async child => {
      const { container, writes } = await mount(child, ['EDITOR'], `/admin/${resource}`)
      await act(async () => container.querySelector<HTMLButtonElement>('.admin-primary-action')!.click())
      const status = container.querySelector<HTMLInputElement>('input[name="status"][value="PUBLICADO"]')
      assert.equal(status?.checked, true)
      const form = container.querySelector<HTMLFormElement>('[role="dialog"] form')!
      await act(async () => form.dispatchEvent(new dom.window.Event('submit', { bubbles: true, cancelable: true })))
      assert.equal(writes.length, 0)
      const confirmation = container.querySelector('[role="alertdialog"]')
      assert.match(confirmation?.textContent ?? '', /ficará visível para todos/)
      await act(async () => container.querySelector<HTMLButtonElement>('[role="alertdialog"] .admin-confirm-actions button:first-child')!.click())
      assert.equal(writes.length, 0)
      await act(async () => form.dispatchEvent(new dom.window.Event('submit', { bubbles: true, cancelable: true })))
      await act(async () => container.querySelector<HTMLButtonElement>('[role="alertdialog"] .admin-confirm-actions button:last-child')!.click())
      assert.equal(writes.length, 1)
      assert.equal(JSON.parse(String(writes[0].options?.body)).status, 'PUBLICADO')
    })
  }
})

test('publicar um rascunho existente também exige confirmação', async t => {
  const { container, writes } = await mount(t, ['EDITOR'], '/admin/noticias')
  await act(async () => container.querySelector<HTMLButtonElement>('.admin-edit-action')!.click())
  const status = container.querySelector<HTMLInputElement>('input[name="status"][value="PUBLICADO"]')!
  await act(async () => status.click())
  const form = container.querySelector<HTMLFormElement>('[role="dialog"] form')!
  await act(async () => form.dispatchEvent(new dom.window.Event('submit', { bubbles: true, cancelable: true })))
  assert.equal(writes.length, 0)
  assert.match(container.querySelector('[role="alertdialog"]')?.textContent ?? '', /ficará visível para todos/)
})

test('falha ao carregar o editor do portal oferece nova tentativa acessível', async t => {
  const { container, controls } = await mount(t, ['SECRETARIA'], '/admin/portal', [], 503)
  assert.ok(container.querySelector('[role="alert"]'))
  controls.portalLoadStatus = 200
  await act(async () => container.querySelector<HTMLButtonElement>('[role="alert"] button')!.click())
  assert.match(container.querySelector('.admin-portal-card header')?.textContent ?? '', /Etapa 1 de 3/)
  assert.equal(container.querySelector('[role="alert"]'), null)
})

test('etapas do editor do portal não avançam com campos obrigatórios vazios ou em branco', async t => {
  const { container } = await mount(t, ['SECRETARIA'], '/admin/portal')
  const form = container.querySelector<HTMLFormElement>('.admin-portal-editor')!
  const change = async (name: string, value: string) => {
    const field = form.querySelector<HTMLInputElement | HTMLTextAreaElement>(`[name="${name}"]`)!
    const prototype = field.tagName === 'TEXTAREA' ? dom.window.HTMLTextAreaElement.prototype : dom.window.HTMLInputElement.prototype
    await act(async () => {
      Object.getOwnPropertyDescriptor(prototype, 'value')!.set!.call(field, value)
      field.dispatchEvent(new dom.window.Event('input', { bubbles: true }))
    })
  }
  await change('heroSlides.0.title', '   ')
  await act(async () => container.querySelector<HTMLButtonElement>('.admin-portal-steps button:nth-child(3)')!.click())
  assert.match(container.querySelector('.admin-portal-card header')!.textContent!, /Etapa 1 de 3/)
  await act(async () => container.querySelector<HTMLButtonElement>('.admin-portal-footer .admin-primary-action')!.click())
  assert.match(container.querySelector('.admin-portal-card header')!.textContent!, /Etapa 1 de 3/)
  await change('heroSlides.0.title', 'Título preenchido')
  await act(async () => container.querySelector<HTMLButtonElement>('.admin-portal-footer .admin-primary-action')!.click())
  assert.match(container.querySelector('.admin-portal-card header')!.textContent!, /Etapa 2 de 3/)
  await change('inicioTitulo', '   ')
  await act(async () => container.querySelector<HTMLButtonElement>('.admin-portal-footer .admin-primary-action')!.click())
  assert.match(container.querySelector('.admin-portal-card header')!.textContent!, /Etapa 2 de 3/)
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

test('administrador edita conta pelo controle padronizado e envia a versão atual', async t => {
  const { container, writes } = await mount(t, ['ADMINISTRADOR'], '/admin/contas', [account])
  const edit = container.querySelector<HTMLButtonElement>('.admin-record-actions .admin-edit-action')
  assert.ok(edit)
  await act(async () => edit.click())
  const active = container.querySelector<HTMLInputElement>('input[type="checkbox"]:not([aria-describedby])')!
  await act(async () => active.click())
  const form = container.querySelector<HTMLFormElement>('[role="dialog"] form')!
  await act(async () => form.dispatchEvent(new dom.window.Event('submit', { bubbles: true, cancelable: true })))
  assert.equal(writes.length, 1)
  assert.equal(writes[0].path, '/api/admin/contas/other-admin')
  assert.deepEqual(JSON.parse(String(writes[0].options!.body)), {
    perfis: ['CONSULTA'], ativo: false, atualizadoEm: account.atualizadoEm,
  })
})
