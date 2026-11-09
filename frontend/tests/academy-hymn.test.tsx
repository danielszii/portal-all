import test, { after } from 'node:test'
import assert from 'node:assert/strict'
import { JSDOM } from 'jsdom'
import { act } from 'react'

const dom = new JSDOM('<!doctype html><html><body></body></html>', { url: 'http://localhost/academia' })
Object.assign(globalThis, { window: dom.window, document: dom.window.document, HTMLElement: dom.window.HTMLElement, IS_REACT_ACT_ENVIRONMENT: true })
const { createRoot } = await import('react-dom/client')
const { createMemoryRouter, RouterProvider } = await import('react-router')
const { default: Academia } = await import('../src/pages/Academia')
const { invalidateInstituicao } = await import('../src/services/api')
after(() => dom.window.close())

test('hino mostra prévia e permite expandir e recolher a letra completa', async t => {
  invalidateInstituicao()
  t.after(invalidateInstituicao)
  t.mock.method(globalThis, 'fetch', async () => Response.json({
    info: {
      nome: 'Academia', historia: 'História', missao: 'Missão', endereco: null, email: null, telefone: null,
      fundacaoAno: 1990, sedeTexto: null, trajetoriaTexto: 'Trajetória', horarioAtendimento: null,
      hinoTitulo: 'Hino da Academia', hinoAutoria: 'Autoria institucional',
      hinoLetra: 'Primeira estrofe\nLinha dois\nLinha três\nLinha quatro\n\nSegunda estrofe\nLinha seis\nLinha sete\nLinha oito\n\nTerceira estrofe final.',
    },
    gestao: null,
  }))
  const container = document.createElement('div'); document.body.append(container)
  const root = createRoot(container)
  const router = createMemoryRouter([{ path: '/academia', Component: Academia }], { initialEntries: ['/academia'] })
  t.after(async () => { await act(async () => root.unmount()); router.dispose(); container.remove() })
  await act(async () => {
    root.render(<RouterProvider router={router} />)
    await new Promise(resolve => setTimeout(resolve, 0))
  })

  const button = container.querySelector<HTMLButtonElement>('[aria-controls="letra-hino"]')!
  assert.ok(button)
  assert.equal(button.getAttribute('aria-expanded'), 'false')
  assert.match(container.querySelector('#letra-hino')!.textContent!, /Primeira estrofe/)
  assert.doesNotMatch(container.querySelector('#letra-hino')!.textContent!, /Terceira estrofe/)

  await act(async () => button.click())
  assert.equal(button.getAttribute('aria-expanded'), 'true')
  assert.match(container.querySelector('#letra-hino')!.textContent!, /Terceira estrofe final/)
  assert.match(button.textContent!, /Recolher hino/)

  await act(async () => button.click())
  assert.equal(button.getAttribute('aria-expanded'), 'false')
  assert.doesNotMatch(container.querySelector('#letra-hino')!.textContent!, /Terceira estrofe/)
})
