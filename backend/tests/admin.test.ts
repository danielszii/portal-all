import test from 'node:test'
import assert from 'node:assert/strict'
import { createApp } from '../src/app.js'
import { serve } from './serve.js'
import { hashPassword, verifyPassword } from '../src/services/admin-auth.service.js'
import { noticiaInput, acervoInput, eventoInput } from '../src/services/admin-content.service.js'
import { uploadExtension } from '../src/services/admin-upload.service.js'
import { prisma } from '../src/db/prisma.js'
import { mockMethod } from './mock-method.js'

test('senhas usam salt individual e não aceitam uma senha incorreta', async () => {
  const password = 'uma senha longa de teste'
  const hash = await hashPassword(password)
  assert.notEqual(hash, await hashPassword(password))
  assert.ok(await verifyPassword(password, hash))
  assert.equal(await verifyPassword('senha incorreta', hash), false)
  await assert.rejects(hashPassword('curta'))
  assert.ok(await verifyPassword('curta', await hashPassword('curta', { allowShortPassword: true })))
  await assert.rejects(hashPassword('', { allowShortPassword: true }))
})

test('todas as operações administrativas exigem sessão antes de acessar o banco', async t => {
  const query = mockMethod(t, prisma.administrador, 'findUnique', () => { throw new Error('Não consultar') })
  const base = await serve(t, createApp())
  for (const path of ['noticias', 'acervo', 'agenda', 'cadeiras', 'academicos', 'patronos', 'uploads', 'auth/me', 'auth/logout']) {
    for (const method of ['GET', 'POST', 'PUT', 'DELETE']) {
      const res = await fetch(base + '/api/admin/' + path, { method })
      assert.equal(res.status, 401, `${method} ${path}`)
      assert.equal(res.headers.get('cache-control'), 'no-store')
    }
  }
  assert.equal(query.mock.callCount(), 0)
})

test('login rejeita origem externa e limita tentativas antes de verificar senhas', async t => {
  const base = await serve(t, createApp())
  for (let i = 0; i < 5; i++) {
    assert.equal((await fetch(base + '/api/admin/auth/login', { method: 'POST', headers: { Origin: 'https://externo.example' } })).status, 403)
  }
  assert.equal((await fetch(base + '/api/admin/auth/login', { method: 'POST' })).status, 429)
})

test('validação editorial bloqueia publicação incompleta, campos extras e URLs executáveis', () => {
  const noticia = { titulo: 'Notícia', categoria: 'Cultura', lede: 'Resumo', conteudo: 'Texto' }
  assert.equal(noticiaInput(noticia).status, 'RASCUNHO')
  assert.throws(() => noticiaInput({ ...noticia, status: 'PUBLICADO' }))
  assert.throws(() => noticiaInput({ ...noticia, img: 'javascript:alert(1)' }))
  assert.throws(() => noticiaInput({ ...noticia, id: 1 }))
  assert.throws(() => acervoInput({ titulo: 'Livro', categoria: 'Livro', status: 'PUBLICADO' }))
  assert.throws(() => acervoInput({ titulo: 'Livro', categoria: 'Livro', paginas: -1 }))
  assert.throws(() => eventoInput({ titulo: 'Evento', tipo: 'Sarau', local: 'Sede', inicioEm: '2026-02-30T15:00:00-03:00' }))
  assert.throws(() => eventoInput({ titulo: 'Evento', tipo: 'Sarau', local: 'Sede', inicioEm: '2026-01-02T15:00:00-03:00', fimEm: '2026-01-01T15:00:00-03:00' }))
})

test('upload rejeita HTML ou SVG disfarçado de imagem/PDF', () => {
  for (const mime of ['image/png', 'image/jpeg', 'image/webp', 'application/pdf', 'image/svg+xml']) {
    assert.throws(() => uploadExtension(Buffer.from('<svg onload="alert(1)"></svg>'), mime))
  }
  assert.equal(uploadExtension(Buffer.from('%PDF-1.4\n%%EOF'), 'application/pdf'), 'pdf')
})
