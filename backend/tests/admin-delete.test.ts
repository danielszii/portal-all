import test, { type TestContext } from 'node:test'
import assert from 'node:assert/strict'
import { Prisma } from '@prisma/client'
import { createApp } from '../src/app.js'
import { prisma } from '../src/db/prisma.js'
import { envConfig } from '../src/config/env.config.js'
import { cookieName } from '../src/middlewares/admin-auth.middleware.js'
import { mockMethod } from './mock-method.js'
import { serve } from './serve.js'

const paths = ['noticias/1', 'acervo/livro', 'agenda/evento', 'academicos/pessoa', 'patronos/pessoa', 'galeria/foto']
const origin = new URL(envConfig.frontendUrl).origin
const headers = { Cookie: `${cookieName}=${'a'.repeat(64)}`, Origin: origin, 'X-CSRF-Token': 'csrf-teste' }
function adminSession(t: TestContext) {
  mockMethod(t, prisma, '$transaction', async callback => callback(prisma))
  mockMethod(t, prisma.sessaoAdmin, 'findUnique', async () => ({
    administrador: { id: 'admin', email: 'admin@example.test', ativo: true }, csrfToken: headers['X-CSRF-Token'], expiraEm: new Date(Date.now() + 60_000),
  }))
}

test('exclusões exigem sessão, origem e CSRF antes de tentar remover registros', async t => {
  adminSession(t)
  const write = mockMethod(t, prisma, '$executeRaw', () => { throw new Error('Não excluir') })
  const transaction = mockMethod(t, prisma, '$transaction', () => { throw new Error('Não iniciar transação') })
  const base = await serve(t, createApp())
  for (const path of paths) {
    const url = `${base}/api/admin/${path}`
    assert.equal((await fetch(url, { method: 'DELETE' })).status, 401, path)
    assert.equal((await fetch(url, { method: 'DELETE', headers: { ...headers, 'X-CSRF-Token': '' } })).status, 403, path)
    assert.equal((await fetch(url, { method: 'DELETE', headers: { ...headers, Origin: 'https://externo.example' } })).status, 403, path)
  }
  assert.equal((await fetch(base + '/api/admin/galeria')).status, 401)
  assert.equal(transaction.mock.callCount(), 0)
  assert.equal(write.mock.callCount(), 0)
})

test('DELETE valida identificadores e informa registros inexistentes sem falso sucesso', async t => {
  adminSession(t)
  const remove = mockMethod(t, prisma, '$executeRaw', async () => 0)
  const base = await serve(t, createApp())
  for (const id of ['0', '-1', '1abc', '1.5', '2147483648']) {
    assert.equal((await fetch(base + '/api/admin/noticias/' + id, { method: 'DELETE', headers })).status, 400)
  }
  assert.equal(remove.mock.callCount(), 0)
  for (const resource of ['noticias', 'acervo', 'academicos', 'patronos', 'galeria']) {
    assert.equal((await fetch(base + '/api/admin/' + resource + '/' + 'a'.repeat(101), { method: 'DELETE', headers })).status, 400)
  }
  for (const path of ['noticias/1', 'galeria/ausente']) {
    assert.equal((await fetch(base + '/api/admin/' + path, { method: 'DELETE', headers })).status, 404)
  }
})

test('pessoas com vínculos recebem conflito explicativo e falhas internas não vazam detalhes', async t => {
  adminSession(t)
  mockMethod(t, prisma, '$executeRaw', async (query: Prisma.Sql) => {
    if (query.sql.includes('"GaleriaFoto"')) throw new Error('credencial interna confidencial')
    throw new Prisma.PrismaClientKnownRequestError('constraint interna', {
      code: 'P2010', clientVersion: '5.22.0', meta: { code: query.sql.includes('"Academico"') ? '23001' : '23503' },
    })
  })
  t.mock.method(console, 'error', () => {})
  const base = await serve(t, createApp())
  for (const resource of ['academicos', 'patronos']) {
    const res = await fetch(base + '/api/admin/' + resource + '/pessoa', { method: 'DELETE', headers })
    assert.equal(res.status, 409)
    const body = await res.json() as { error: string }
    assert.match(body.error, /vínculos/)
    assert.doesNotMatch(body.error, /constraint/)
  }
  const res = await fetch(base + '/api/admin/galeria/foto', { method: 'DELETE', headers })
  assert.equal(res.status, 500)
  assert.doesNotMatch(await res.text(), /credencial/)
})

test('ID de exclusão é tratado como dado, nunca como comando SQL', async t => {
  adminSession(t)
  const id = "foto' OR 1=1 --"
  const remove = mockMethod(t, prisma, '$executeRaw', async (query: Prisma.Sql) => {
    assert.deepEqual(query.values, [id])
    assert.equal(query.sql.includes(id), false)
    return 0
  })
  const base = await serve(t, createApp())
  const res = await fetch(base + '/api/admin/galeria/' + encodeURIComponent(id), { method: 'DELETE', headers })
  assert.equal(res.status, 404)
  assert.equal(remove.mock.callCount(), 1)
})
