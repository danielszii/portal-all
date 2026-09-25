import test, { after, type TestContext } from 'node:test'
import assert from 'node:assert/strict'
import { JSDOM } from 'jsdom'
import { act } from 'react'

const dom = new JSDOM('<!doctype html><html><body></body></html>', { url: 'http://localhost/admin/noticias' })
Object.assign(globalThis, { window: dom.window, document: dom.window.document, HTMLElement: dom.window.HTMLElement, IS_REACT_ACT_ENVIRONMENT: true })
const { createRoot } = await import('react-dom/client')
const { createMemoryRouter, RouterProvider } = await import('react-router')
const { AuthProvider } = await import('../src/contexts/AuthContext')
const { default: RequireAuth } = await import('../src/components/RequireAuth')
const { default: AdminNoticias } = await import('../src/pages/AdminNoticias')
const { default: Busca } = await import('../src/pages/Busca')
after(() => dom.window.close())

const record = { id: 1, titulo: 'Título original', categoria: 'Institucional', lede: 'Resumo', conteudo: 'Texto', status: 'RASCUNHO', atualizadoEm: '2020-01-01T00:00:00.000Z' }
const session = { user: { id: 'admin', email: 'admin@example.test' }, csrfToken: 'a'.repeat(64), expiraEm: new Date(Date.now() + 3600000).toISOString() }

async function editor(t: TestContext) {
  let status = 200
  t.mock.method(globalThis, 'fetch', async (path: string) => {
    if (path.endsWith('/auth/me')) return status === 200 ? Response.json(session) : Response.json({ error: 'Indisponível' }, { status })
    if (path.endsWith('/noticias/1')) return Response.json(record)
    return Response.json({ items: [record], total: 1, page: 1, pageSize: 20, totalPages: 1 })
  })
  const container = document.createElement('div')
  document.body.append(container)
  const root = createRoot(container)
  const router = createMemoryRouter([
    { Component: RequireAuth, children: [{ path: '/admin/noticias', Component: AdminNoticias }] },
    { path: '/login', element: <p>Login necessário</p> },
  ], { initialEntries: ['/admin/noticias'] })
  t.after(async () => { await act(async () => root.unmount()); router.dispose(); container.remove() })
  await act(async () => root.render(<AuthProvider><RouterProvider router={router} /></AuthProvider>))
  const edit = [...container.querySelectorAll('button')].find(button => button.textContent === 'Editar')
  assert.ok(edit)
  await act(async () => edit.click())
  const input = container.querySelector<HTMLInputElement>('input[name="titulo"]')
  assert.ok(input)
  await act(async () => {
    Object.getOwnPropertyDescriptor(dom.window.HTMLInputElement.prototype, 'value')!.set!.call(input, 'Rascunho ainda não salvo')
    input.dispatchEvent(new dom.window.Event('input', { bubbles: true }))
  })
  return { container, input, async refresh(nextStatus: number) {
    status = nextStatus
    await act(async () => { window.dispatchEvent(new dom.window.Event('focus')) })
  } }
}

test('falha temporária e recuperação da sessão preservam o editor e seu rascunho', async t => {
  const { container, input, refresh } = await editor(t)
  await refresh(503)
  assert.equal(container.querySelector('input[name="titulo"]'), input)
  assert.equal(input.value, 'Rascunho ainda não salvo')
  assert.ok(container.querySelector('[role="dialog"]'))
  await refresh(200)
  assert.equal(container.querySelector('input[name="titulo"]'), input)
  assert.equal(input.value, 'Rascunho ainda não salvo')
})

test('sessão revogada continua removendo o editor e redirecionando ao login', async t => {
  const { container, refresh } = await editor(t)
  await refresh(401)
  assert.equal(container.querySelector('[role="dialog"]'), null)
  assert.match(container.textContent ?? '', /Login necessário/)
})

test('busca carrega a próxima página uma vez e preserva resultados ao tentar novamente', async t => {
  let visible: (() => void) | undefined
  const originalObserver = globalThis.IntersectionObserver
  Object.assign(globalThis, { IntersectionObserver: class {
    constructor(callback: (entries: { isIntersecting: boolean }[]) => void) { visible = () => callback([{ isIntersecting: true }]) }
    observe() {}
    disconnect() { visible = undefined }
  } })
  t.after(() => { globalThis.IntersectionObserver = originalObserver })
  const pages: number[] = []
  let fail = true
  t.mock.method(globalThis, 'fetch', async (path: string) => {
    const page = Number(new URL(path, 'http://localhost').searchParams.get('page'))
    pages.push(page)
    if (page === 2 && fail) return Response.json({ error: 'Conexão indisponível' }, { status: 503 })
    return Response.json({ page, totalPages: 2, cadeiras: [], acervo: [], noticias: page === 1 ? [{ id: 1, titulo: 'Primeira notícia' }] : [{ id: 1, titulo: 'Primeira notícia' }, { id: 2, titulo: 'Segunda notícia' }] })
  })
  const container = document.createElement('div')
  document.body.append(container)
  const root = createRoot(container)
  const router = createMemoryRouter([{ path: '/busca', Component: Busca }], { initialEntries: ['/busca?q=noticia'] })
  t.after(async () => { await act(async () => root.unmount()); router.dispose(); container.remove() })
  await act(async () => root.render(<RouterProvider router={router} />))
  assert.equal(container.querySelectorAll('.search-result').length, 1)
  assert.ok(visible)
  const enter = visible
  await act(async () => { enter(); enter() })
  assert.deepEqual(pages, [1, 2])
  assert.equal(container.querySelectorAll('.search-result').length, 1)
  assert.match(container.textContent ?? '', /Conexão indisponível/)
  fail = false
  const retry = [...container.querySelectorAll('button')].find(button => button.textContent === 'Tentar novamente')
  assert.ok(retry)
  await act(async () => retry.click())
  assert.deepEqual(pages, [1, 2, 2])
  assert.equal(container.querySelectorAll('.search-result').length, 2)
  assert.match(container.textContent ?? '', /Segunda notícia/)
})
