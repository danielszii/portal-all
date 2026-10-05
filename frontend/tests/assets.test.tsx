import test from 'node:test'
import assert from 'node:assert/strict'
import { readdir, stat } from 'node:fs/promises'
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
