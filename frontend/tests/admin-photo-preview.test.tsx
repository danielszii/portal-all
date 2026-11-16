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

test('upload da foto de cadeira In Memoriam atualiza a prévia antes de salvar', async t => {
  const chair = {
    id: 'chair-memorial',
    numero: 77,
    categoria: 'IN_MEMORIAM',
    versao: 'a'.repeat(64),
    patrono: { id: 'patron-memorial', nome: 'Patrono memorial', biografia: null, fotoUrl: null },
    ocupacoes: [{
      id: 'occupation-memorial',
      cadeiraId: 'chair-memorial',
      academicoId: 'member-memorial',
      vigente: false,
      fundador: false,
      inicioEm: null,
      inicioAno: null,
      fimEm: null,
      fimAno: null,
      academico: {
        id: 'member-memorial',
        nome: 'Acadêmico memorial',
        biografia: null,
        bioExtra: null,
        fotoUrl: null,
        inMemoriam: false,
      },
    }],
  }
  const session = {
    user: publicAdmin({ id: 'admin', email: 'admin@example.test', perfis: ['SECRETARIA'] }),
    csrfToken: 'a'.repeat(64),
    expiraEm: new Date(Date.now() + 3_600_000).toISOString(),
  }
  t.mock.method(globalThis, 'fetch', async (input: string | URL | Request) => {
    const path = String(input)
    if (path.endsWith('/auth/me')) return Response.json(session)
    if (path.startsWith('/api/admin/cadeiras?')) return Response.json({ items: [chair], total: 1, page: 1, pageSize: 20, totalPages: 1 })
    if (path.startsWith('/api/admin/cadeiras/')) return Response.json(chair)
    throw new Error(`Requisição inesperada: ${path}`)
  })
  t.mock.method(URL, 'createObjectURL', () => 'blob:memorial-preview')

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

  const edit = container.querySelector<HTMLButtonElement>('.admin-edit-action')
  assert.ok(edit)
  await act(async () => edit.click())
  const input = container.querySelector<HTMLInputElement>('input[name="foto"]')
  assert.ok(input)
  assert.equal(input.disabled, false)
  const file = new dom.window.File(['portrait'], 'portrait.png', { type: 'image/png' })
  Object.defineProperty(input, 'files', { value: [file], configurable: true })
  await act(async () => input.dispatchEvent(new dom.window.Event('change', { bubbles: true })))

  assert.equal(container.querySelector('.admin-live-preview img')?.getAttribute('src'), 'blob:memorial-preview')
  assert.equal(container.querySelector('.admin-file-image-preview img')?.getAttribute('src'), 'blob:memorial-preview')
})
