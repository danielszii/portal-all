import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile, readdir, stat } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const frontend = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

test('imagem principal respeita o orçamento de 300 KB', async () => {
  const image = await stat(path.join(frontend, 'src/imports/academialetters.jpg'))
  assert.ok(image.size <= 300_000, `Imagem principal possui ${image.size} bytes`)
})

test('retratos demonstrativos respeitam o limite individual de 1,5 MB', async () => {
  const directory = path.join(frontend, 'public/images/membros')
  const files = await readdir(directory)
  for (const file of files) {
    const image = await stat(path.join(directory, file))
    assert.ok(image.size <= 1_500_000, `${file} possui ${image.size} bytes`)
  }
})

test('todas as cores de capa usadas pelo acervo têm fundo na home', async () => {
  const css = await readFile(path.join(frontend, 'src/index.css'), 'utf8')
  for (const color of ['navy', 'ochre', 'ink', 'red', 'green']) {
    assert.match(css, new RegExp(`\\.book-cover\\.${color}\\s*\\{[^}]*background:`), `Capa ${color} sem fundo`)
  }
})

test('títulos das capas são limitados sem ultrapassar o cartão', async () => {
  const css = await readFile(path.join(frontend, 'src/index.css'), 'utf8')
  const rule = css.match(/\.book-cover strong\s*\{([^}]*)\}/)?.[1] ?? ''
  assert.match(rule, /overflow:\s*hidden/)
  assert.match(rule, /text-overflow:\s*ellipsis/)
  assert.match(rule, /-webkit-line-clamp:\s*3/)
})
