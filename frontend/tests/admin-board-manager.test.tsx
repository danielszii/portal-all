import test from 'node:test'
import assert from 'node:assert/strict'
import { JSDOM } from 'jsdom'
import { act } from 'react'
import { publicAdmin } from '../../backend/src/domain/admin-permissions.js'

const dom = new JSDOM('<!doctype html><html><body></body></html>', { url: 'http://localhost/admin/instituicao' })
Object.assign(globalThis, {
  window: dom.window,
  document: dom.window.document,
  HTMLElement: dom.window.HTMLElement,
  IS_REACT_ACT_ENVIRONMENT: true,
})
const { createRoot } = await import('react-dom/client')
const { AuthProvider } = await import('../src/contexts/AuthContext')
const { default: AdminBoardManager } = await import('../src/components/admin/AdminBoardManager')

test('erro ao salvar o período aparece no formulário e preserva os anos informados', async t => {
  const board = {
    id: 'gestao-1',
    inicioAno: 2024,
    fimAno: 2025,
    atualizadoEm: '2026-10-01T12:00:00.000Z',
    mandatos: [],
  }
  const session = {
    user: publicAdmin({ id: 'admin', email: 'admin@example.test', perfis: ['ADMINISTRADOR'] }),
    csrfToken: 'a'.repeat(64),
    expiraEm: new Date(Date.now() + 3_600_000).toISOString(),
  }
  t.mock.method(globalThis, 'fetch', async (input: string | URL | Request, init: RequestInit = {}) => {
    const path = String(input)
    if (path.endsWith('/auth/me')) return Response.json(session)
    if (path === '/api/admin/gestoes?page=1&pageSize=50') {
      return Response.json({ items: [{ ...board, _count: { mandatos: 0 } }], total: 1, page: 1, pageSize: 50, totalPages: 1 })
    }
    if (path === '/api/admin/academicos?page=1&pageSize=50') {
      return Response.json({ items: [], total: 0, page: 1, pageSize: 50, totalPages: 1 })
    }
    if (path === '/api/admin/gestoes/gestao-1' && init.method !== 'PUT') return Response.json(board)
    if (path === '/api/admin/gestoes/gestao-1' && init.method === 'PUT') {
      return Response.json({ error: 'Os anos informados coincidem com outra gestão.' }, { status: 409 })
    }
    throw new Error(`Requisição inesperada: ${path}`)
  })

  const container = document.createElement('div')
  document.body.append(container)
  const root = createRoot(container)
  t.after(async () => {
    await act(async () => root.unmount())
    container.remove()
    dom.window.close()
  })

  await act(async () => root.render(
    <AuthProvider><AdminBoardManager onClose={() => {}} onChanged={() => {}} /></AuthProvider>,
  ))
  const click = async (label: string) => {
    const button = [...container.querySelectorAll<HTMLButtonElement>('button')]
      .find(item => item.textContent?.trim() === label)
    assert.ok(button, `Botão "${label}" não encontrado`)
    await act(async () => button.click())
  }

  await click('Gerenciar')
  await click('Editar período')
  const inputs = container.querySelectorAll<HTMLInputElement>('.admin-nested-overlay input')
  assert.equal(inputs.length, 2)
  const setInput = async (input: HTMLInputElement, value: string) => {
    await act(async () => {
      Object.getOwnPropertyDescriptor(dom.window.HTMLInputElement.prototype, 'value')!.set!.call(input, value)
      input.dispatchEvent(new dom.window.Event('input', { bubbles: true }))
    })
  }
  await setInput(inputs[0], '2026')
  await setInput(inputs[1], '2027')
  await act(async () => container.querySelector('.admin-nested-overlay form')!
    .dispatchEvent(new dom.window.Event('submit', { bubbles: true, cancelable: true })))

  const alert = container.querySelector('.admin-nested-overlay [role="alert"]')
  assert.equal(alert?.textContent, 'Os anos informados coincidem com outra gestão.')
  assert.equal(container.querySelector('.admin-board-manager-body > [role="alert"]'), null)
  assert.equal(container.querySelector('#board-editor-title')?.textContent, 'Editar período')
  assert.deepEqual([...container.querySelectorAll<HTMLInputElement>('.admin-nested-overlay input')].map(input => input.value), ['2026', '2027'])
})
