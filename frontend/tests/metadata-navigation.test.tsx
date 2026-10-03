import test, { after } from 'node:test'
import assert from 'node:assert/strict'
import { JSDOM } from 'jsdom'
import { act } from 'react'

const dom = new JSDOM('<!doctype html><html><head><meta name="description"></head><body></body></html>', { url: 'https://academialimoeirense.test/' })
Object.assign(globalThis, { window: dom.window, document: dom.window.document, HTMLElement: dom.window.HTMLElement, IS_REACT_ACT_ENVIRONMENT: true })
const { createRoot } = await import('react-dom/client')
const { createMemoryRouter, RouterProvider } = await import('react-router')
const { default: PageMetadata } = await import('../src/components/PageMetadata')
const { default: NaoEncontrada } = await import('../src/pages/NaoEncontrada')
after(() => dom.window.close())

async function render(path: string, element: React.ReactNode) {
  const container = document.createElement('div')
  document.body.append(container)
  const root = createRoot(container)
  const router = createMemoryRouter([{ path: '*', element }], { initialEntries: [path] })
  await act(async () => root.render(<RouterProvider router={router} />))
  return { container, async dispose() { await act(async () => root.unmount()); router.dispose(); container.remove() } }
}

test('metadados refletem a rota pública e configuram compartilhamento', async () => {
  const view = await render('/acervo?page=2', <PageMetadata />)
  assert.equal(document.title, 'Acervo digital | A.L.L.')
  assert.match(document.querySelector('meta[name="description"]')?.getAttribute('content') ?? '', /publicações/)
  assert.equal(document.querySelector('meta[name="twitter:card"]')?.getAttribute('content'), 'summary_large_image')
  assert.equal(document.querySelector('link[rel="canonical"]')?.getAttribute('href'), 'https://academialimoeirense.test/acervo')
  await view.dispose()
})

test('rota desconhecida recebe metadados de erro', async () => {
  const view = await render('/conteudo-inexistente', <PageMetadata />)
  assert.equal(document.title, 'Página não encontrada | A.L.L.')
  assert.match(document.querySelector('meta[property="og:title"]')?.getAttribute('content') ?? '', /não encontrada/)
  await view.dispose()
})

test('página 404 oferece retorno e pesquisa com links nativos', async () => {
  const view = await render('/nao-existe', <NaoEncontrada />)
  const links = [...view.container.querySelectorAll('a')]
  assert.deepEqual(links.map(link => link.getAttribute('href')), ['/', '/busca'])
  assert.match(view.container.textContent ?? '', /Erro 404/)
  await view.dispose()
})
