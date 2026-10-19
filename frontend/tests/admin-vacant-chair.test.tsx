import test from 'node:test'
import assert from 'node:assert/strict'
import { JSDOM } from 'jsdom'
import { act } from 'react'
import { publicAdmin } from '../../backend/src/domain/admin-permissions.js'

const dom = new JSDOM('<!doctype html><html><body></body></html>', { url: 'http://localhost/admin/membros' })
Object.assign(globalThis, {
  window: dom.window,
  document: dom.window.document,
  HTMLElement: dom.window.HTMLElement,
  IS_REACT_ACT_ENVIRONMENT: true,
})
const { createRoot } = await import('react-dom/client')
const { createMemoryRouter, RouterProvider } = await import('react-router')
const { AuthProvider } = await import('../src/contexts/AuthContext')
const { default: AdminMembros } = await import('../src/pages/AdminMembros')

test('cadeira vaga permite adicionar titular preservando número e patrono', async t => {
  const chair = {
    id: 'chair-12',
    numero: 12,
    versao: 'b'.repeat(64),
    patrono: { id: 'patron-12', nome: 'Patrono da cadeira', biografia: null, fotoUrl: null },
    ocupacoes: [{
      id: 'past-occupation',
      cadeiraId: 'chair-12',
      academicoId: 'past-member',
      vigente: false,
      fundador: false,
      inicioEm: '2010-01-01T00:00:00.000Z',
      inicioAno: 2010,
      fimEm: '2020-01-01T00:00:00.000Z',
      fimAno: 2020,
      academico: { id: 'past-member', nome: 'Titular anterior', biografia: null, fotoUrl: null },
    }],
  }
  const session = {
    user: publicAdmin({ id: 'admin', email: 'admin@example.test', perfis: ['SECRETARIA'] }),
    csrfToken: 'a'.repeat(64),
    expiraEm: new Date(Date.now() + 3_600_000).toISOString(),
  }
  const writes: { path: string; body: Record<string, unknown> }[] = []
  t.mock.method(globalThis, 'fetch', async (input: string | URL | Request, init: RequestInit = {}) => {
    const path = String(input)
    if (path.endsWith('/auth/me')) return Response.json(session)
    if (path === '/api/admin/cadeiras?page=1&pageSize=20&q=') {
      return Response.json({ items: [chair], total: 1, page: 1, pageSize: 20, totalPages: 1 })
    }
    if (path === '/api/admin/cadeiras/12' && init.method === 'GET') return Response.json(chair)
    if (path === '/api/admin/cadeiras' && init.method === 'POST') {
      const body = JSON.parse(String(init.body)) as Record<string, unknown>
      writes.push({ path, body })
      if (writes.length === 1) return Response.json({
        error: 'O número já existe. Confirme a substituição com a ocupação atual exibida.',
        code: 'CONFIRMACAO_CADEIRA',
        cadeira: chair,
        ocupacaoAtualId: null,
      }, { status: 409 })
      return Response.json({ ...chair, ocupacoes: [...chair.ocupacoes, {
        id: 'new-occupation',
        cadeiraId: 'chair-12',
        academicoId: 'new-member',
        vigente: true,
        fundador: false,
        inicioEm: '2026-01-01T03:00:00.000Z',
        inicioAno: 2026,
        fimEm: null,
        fimAno: null,
        academico: { id: 'new-member', nome: 'Novo titular', biografia: null, fotoUrl: null },
      }] })
    }
    throw new Error(`Requisição inesperada: ${path}`)
  })

  const container = document.createElement('div')
  document.body.append(container)
  const root = createRoot(container)
  const router = createMemoryRouter([{ path: '/admin/membros', Component: AdminMembros }], { initialEntries: ['/admin/membros'] })
  t.after(async () => {
    await act(async () => root.unmount())
    router.dispose()
    container.remove()
    dom.window.close()
  })
  await act(async () => root.render(<AuthProvider><RouterProvider router={router} /></AuthProvider>))

  const addHolder = [...container.querySelectorAll<HTMLButtonElement>('.admin-edit-action')]
    .find(button => button.textContent?.includes('Adicionar titular'))
  assert.ok(addHolder, 'A cadeira vaga deve oferecer a ação Adicionar titular')
  await act(async () => addHolder.click())

  const form = container.querySelector<HTMLFormElement>('[role="dialog"] form')
  assert.ok(form, container.textContent)
  const chairNumber = form.querySelector<HTMLInputElement>('[name="cadeira"]')!
  assert.equal(chairNumber.value, '12')
  assert.equal(chairNumber.disabled, true)
  assert.equal(form.querySelector<HTMLSelectElement>('[name="status"]')!.value, 'Titular em exercício')
  assert.equal(form.querySelector<HTMLInputElement>('[name="nome"]')!.disabled, false)
  assert.equal(form.querySelector<HTMLInputElement>('[name="posse"]')!.disabled, false)
  assert.equal(form.querySelector<HTMLInputElement>('[name="patrono"]')!.value, 'Patrono da cadeira')

  const setValue = async (name: string, value: string) => {
    const field = form.querySelector<HTMLInputElement>(`[name="${name}"]`)!
    await act(async () => {
      Object.getOwnPropertyDescriptor(dom.window.HTMLInputElement.prototype, 'value')!.set!.call(field, value)
      field.dispatchEvent(new dom.window.Event('input', { bubbles: true }))
    })
  }
  await setValue('nome', 'Novo titular')
  await setValue('posse', '2026-01-01')
  await act(async () => form.dispatchEvent(new dom.window.Event('submit', { bubbles: true, cancelable: true })))
  const confirm = container.querySelector<HTMLButtonElement>('[role="alertdialog"] button:not(.admin-confirm-close):last-child')
  assert.ok(confirm, 'A posse em cadeira existente exige confirmação')
  await act(async () => confirm.click())

  assert.equal(writes.length, 2)
  assert.equal(writes[0].path, '/api/admin/cadeiras')
  assert.equal(writes[0].body.numero, 12)
  assert.equal(writes[0].body.patrono && (writes[0].body.patrono as { nome: string }).nome, 'Patrono da cadeira')
  assert.equal((writes[0].body.academico as { nome: string }).nome, 'Novo titular')
  assert.equal(writes[0].body.inicioEm, '2026-01-01')
  assert.equal(writes[1].body.confirmarSubstituicao, true)
  assert.equal(writes[1].body.ocupacaoAtualId, null)
  assert.equal(container.querySelector('[role="dialog"]'), null)
})
