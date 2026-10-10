import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { renderToStaticMarkup } from 'react-dom/server'
import Pagination from '../src/components/Pagination'

const frontend = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const source = (relative: string) => readFile(path.join(frontend, 'src', relative), 'utf8')

test('paginação expõe navegação, página atual e controles nomeados', () => {
  const html = renderToStaticMarkup(<Pagination page={2} totalPages={4} onChange={() => undefined} />)
  assert.match(html, /<nav[^>]+aria-label="Paginação"/)
  assert.match(html, /aria-current="page"/)
  assert.match(html, /aria-label="Página anterior"/)
  assert.match(html, /aria-label="Próxima página"/)
  assert.match(html, /aria-live="polite"/)
})

test('paginação retorna ao início da lista respeitando movimento reduzido', async () => {
  const pagination = await source('components/Pagination.tsx')
  assert.match(pagination, /closest<HTMLElement>\('\[data-pagination-start\], section'\)/)
  assert.match(pagination, /prefers-reduced-motion: reduce/)
  assert.match(pagination, /window\.scrollTo\(\{ top: targetTop/)
})

test('layout oferece salto para o conteúdo e foco programático após navegação', async () => {
  const layout = await source('components/Layout.tsx')
  assert.match(layout, /className="skip-link" href="#conteudo-principal"/)
  assert.match(layout, /id="conteudo-principal" tabIndex=\{-1\}/)
  assert.match(layout, /mainRef\.current\?\.focus\(\{ preventScroll: true \}\)/)
})

test('carrossel pausa durante interação e respeita preferência por movimento reduzido', async () => {
  const home = await source('pages/Home.tsx')
  assert.match(home, /prefers-reduced-motion: reduce/)
  assert.match(home, /onMouseEnter=\{\(\) => setHeroPaused\(true\)\}/)
  assert.match(home, /onFocusCapture=\{\(\) => setHeroPaused\(true\)\}/)
  assert.doesNotMatch(home, /hero-pause/)
})

test('notícias da home usam o cartão como link sem botão redundante', async () => {
  const home = await source('pages/Home.tsx')
  assert.match(home, /className="home-news-link"/)
  assert.doesNotMatch(home, />Ler notícia/)
})

test('acordeão literário usa botão nativo e relacionamento aria-controls', async () => {
  const member = await source('pages/Membro.tsx')
  assert.match(member, /<button type="button" className="producao-header"/)
  assert.match(member, /aria-controls=\{panelId\}/)
  assert.doesNotMatch(member, /role="button"/)
})

test('modais possuem nome acessível, descrição e foco contido', async () => {
  const gallery = await source('components/GalleryModal.tsx')
  const archive = await source('pages/Acervo.tsx')
  const dialog = await source('hooks/useDialog.ts')
  assert.match(gallery, /aria-labelledby="gallery-modal-title"/)
  assert.match(gallery, /aria-describedby="gallery-modal-position"/)
  assert.match(archive, /aria-labelledby="pdf-modal-title"/)
  assert.match(dialog, /event\.key === 'Escape'/)
  assert.match(dialog, /event\.key !== 'Tab'/)
  assert.match(dialog, /previous\?\.focus\(\)/)
})

test('estilos mantêm foco visível, alto contraste e movimento reduzido', async () => {
  const css = await source('index.css')
  assert.match(css, /--focus-ring:/)
  assert.match(css, /input:focus-visible/)
  assert.match(css, /@media \(forced-colors: active\)/)
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/)
  assert.match(css, /animation-duration:\s*\.01ms/)
})
