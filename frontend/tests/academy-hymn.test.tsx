import test, { after } from 'node:test'
import assert from 'node:assert/strict'
import { JSDOM } from 'jsdom'
import { act } from 'react'

const dom = new JSDOM('<!doctype html><html><body></body></html>', { url: 'http://localhost/academia' })
Object.assign(globalThis, { window: dom.window, document: dom.window.document, HTMLElement: dom.window.HTMLElement, IS_REACT_ACT_ENVIRONMENT: true })
const { createRoot } = await import('react-dom/client')
const { createMemoryRouter, RouterProvider } = await import('react-router')
const { default: Academia } = await import('../src/pages/Academia')
const { default: Hino } = await import('../src/pages/Hino')
const { invalidateInstituicao } = await import('../src/services/api')
after(() => dom.window.close())

const payload = {
  info: {
    nome: 'Academia', historia: 'História', missao: 'Missão', endereco: null, email: null, telefone: null,
    fundacaoAno: 1990, sedeTexto: null, trajetoriaTexto: 'Trajetória', horarioAtendimento: null,
    hinoTitulo: 'Hino da Academia', hinoAutoria: 'Autoria institucional', hinoApresentacao: 'Uma canção sobre memória e cultura.',
    hinoCreditos: 'Interpretação: Coral da Academia', hinoVideoUrl: 'https://youtu.be/dQw4w9WgXcQ',
    hinoLetra: 'Primeira estrofe\nLinha dois\n\nSegunda estrofe final.',
  },
  gestao: null,
}

async function renderRoute(path: string, Component: typeof Academia) {
  invalidateInstituicao()
  const container = document.createElement('div'); document.body.append(container)
  const root = createRoot(container)
  const router = createMemoryRouter([{ path, Component }], { initialEntries: [path] })
  await act(async () => {
    root.render(<RouterProvider router={router} />)
    await new Promise(resolve => setTimeout(resolve, 0))
  })
  return { container, async close() { await act(async () => root.unmount()); router.dispose(); container.remove(); invalidateInstituicao() } }
}

test('Academia apresenta uma chamada compacta para a página do hino', async t => {
  const intro = Array.from({ length: 10 }, (_, index) => `Parágrafo ${index + 1} da apresentação institucional.`).join(' ')
  t.mock.method(globalThis, 'fetch', async (path: string) => path.endsWith('/portal')
    ? Response.json({ academiaIntroducao: intro })
    : Response.json(payload))
  const view = await renderRoute('/academia', Academia)
  t.after(view.close)
  const introToggle = view.container.querySelector<HTMLButtonElement>('.academia-intro-toggle')
  assert.ok(introToggle)
  assert.equal(introToggle.textContent, 'Ler mais')
  assert.equal(introToggle.getAttribute('aria-expanded'), 'false')
  assert.ok(view.container.querySelector('.academia-intro-copy.is-collapsed'))
  await act(async () => introToggle.click())
  assert.equal(introToggle.textContent, 'Ler menos')
  assert.equal(introToggle.getAttribute('aria-expanded'), 'true')
  assert.equal(view.container.querySelector('.academia-intro-copy.is-collapsed'), null)
  const link = view.container.querySelector<HTMLAnchorElement>('a[href="/academia/hino"]')
  assert.ok(link)
  assert.match(link.textContent!, /Conhecer o hino/)
  assert.match(view.container.textContent!, /Uma canção sobre memória e cultura/)
  assert.doesNotMatch(view.container.textContent!, /Segunda estrofe final/)
})

test('página do hino carrega o player somente após a interação', async t => {
  t.mock.method(globalThis, 'fetch', async () => Response.json(payload))
  const view = await renderRoute('/academia/hino', Hino)
  t.after(view.close)
  assert.equal(view.container.querySelector('iframe'), null)
  const play = view.container.querySelector<HTMLButtonElement>('.hino-video-poster')
  assert.ok(play)
  assert.match(view.container.textContent!, /Segunda estrofe final/)
  assert.match(view.container.textContent!, /Coral da Academia/)
  assert.equal(view.container.querySelectorAll('.hino-lyrics > p').length, 2)
  await act(async () => play.click())
  const frame = view.container.querySelector<HTMLIFrameElement>('iframe')
  assert.ok(frame)
  assert.match(frame.src, /youtube-nocookie\.com\/embed\/dQw4w9WgXcQ/)
  assert.equal(frame.getAttribute('allowfullscreen'), '')
})
