import { mockMethod } from './mock-method.js'
import test from 'node:test'
import assert from 'node:assert/strict'
import express from 'express'
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createApp } from '../src/app.js'
import { createContatoLimit } from '../src/middlewares/contato-limit.middleware.js'
import { prisma } from '../src/db/prisma.js'
import { serve } from './serve.js'

test('produção entrega HTML na raiz e nas rotas React; API desconhecida continua 404', async t => {
  const dir = await mkdtemp(join(tmpdir(), 'portal-http-'))
  t.after(() => rm(dir, { recursive: true, force: true }))
  const html = '<!doctype html><html lang="pt-BR"><body>Portal</body></html>'
  await writeFile(join(dir, 'index.html'), html)
  const url = await serve(t, createApp(dir))
  for (const path of ['/', '/academia', '/cadeiras/i']) {
    const res = await fetch(url + path)
    assert.equal(res.status, 200)
    assert.match(res.headers.get('content-type') ?? '', /text\/html/)
    assert.equal(await res.text(), html)
  }
  assert.equal((await fetch(url + '/api')).status, 200)
  for (const path of ['/api/inexistente', '/api/contato']) {
    const res = await fetch(url + path)
    assert.equal(res.status, 404)
    assert.match(res.headers.get('content-type') ?? '', /application\/json/)
  }
})

test('contato rejeita JSON inválido e tamanho excessivo sem persistir', async t => {
  const create = mockMethod(t, prisma.contatoMensagem, 'create', () => { throw new Error('Não deve persistir') })
  const url = await serve(t, createApp())
  for (const [body, status] of [['{', 400], [JSON.stringify({ mensagem: 'x'.repeat(33_000) }), 413]] as const) {
    const res = await fetch(url + '/api/contato', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body })
    assert.equal(res.status, status)
  }
  assert.equal(create.mock.callCount(), 0)
})

test('limite de contato bloqueia excesso, ignora IP forjado e libera ao expirar', async t => {
  let now = 1000
  let stored = 0
  const app = express()
  app.post('/contato', createContatoLimit({ limit: 2, windowMs: 60_000, now: () => now }), (_req, res) => {
    stored++
    res.status(201).json({ sucesso: true })
  })
  const url = await serve(t, app)
  const post = (ip: string) => fetch(url + '/contato', { method: 'POST', headers: { 'X-Forwarded-For': ip } })
  assert.equal((await post('1.1.1.1')).status, 201)
  assert.equal((await post('2.2.2.2')).status, 201)
  const blocked = await post('3.3.3.3')
  assert.equal(blocked.status, 429)
  assert.equal(blocked.headers.get('retry-after'), '60')
  assert.equal(stored, 2)
  now += 60_000
  assert.equal((await post('4.4.4.4')).status, 201)
  assert.equal(stored, 3)
})

test('falha do banco nos destaques não retorna dados demonstrativos', async t => {
  mockMethod(t, prisma.noticia, 'findMany', async () => { throw new Error('Banco indisponível') })
  t.mock.method(console, 'error', () => {})
  const url = await serve(t, createApp())
  const res = await fetch(url + '/api/inicio/noticias')
  assert.equal(res.status, 500)
  assert.deepEqual(await res.json(), { status: 'error', statusCode: 500, error: 'Ocorreu um erro interno no servidor.' })
})

test('limitador de login desconta sucessos, preserva bloqueio de falhas e libera ao expirar', async t => {
  let now = 0
  const app = express()
  let attempts = 0
  app.post('/login', createContatoLimit({ limit: 2, windowMs: 60000, now: () => now, skipSuccessfulRequests: true }), (req, res) => {
    attempts++
    res.sendStatus(req.query.valid === 'true' ? 200 : 401)
  })
  const base = await serve(t, app)
  for (let i = 0; i < 4; i++) assert.equal((await fetch(base + '/login?valid=true', { method: 'POST' })).status, 200)
  assert.equal((await fetch(base + '/login', { method: 'POST' })).status, 401)
  assert.equal((await fetch(base + '/login?valid=true', { method: 'POST' })).status, 200)
  assert.equal((await fetch(base + '/login', { method: 'POST' })).status, 401)
  const blocked = await fetch(base + '/login?valid=true', { method: 'POST' })
  assert.equal(blocked.status, 429)
  assert.equal(blocked.headers.get('retry-after'), '60')
  assert.equal(attempts, 7)
  now += 60000
  assert.equal((await fetch(base + '/login?valid=true', { method: 'POST' })).status, 200)
})
