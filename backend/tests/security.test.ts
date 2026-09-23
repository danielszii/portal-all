import test from 'node:test'
import assert from 'node:assert/strict'
import { createApp } from '../src/app.js'
import { serve } from './serve.js'
import { prisma } from '../src/db/prisma.js'
import { mockMethod } from './mock-method.js'

test('respostas incluem proteção do navegador sem bloquear fontes e PDF usados pelo portal', async t => {
  const url = await serve(t, createApp())
  for (const path of ['/api/health', '/api/inexistente']) {
    const res = await fetch(url + path)
    assert.equal(res.headers.get('x-powered-by'), null)
    assert.equal(res.headers.get('x-content-type-options'), 'nosniff')
    assert.equal(res.headers.get('x-frame-options'), 'DENY')
    const policy = res.headers.get('content-security-policy') ?? ''
    assert.ok(policy.includes("script-src 'self'"))
    assert.ok(policy.includes("frame-ancestors 'none'"))
    assert.ok(policy.includes("frame-src 'self' https://docs.google.com"))
    assert.ok(policy.includes('https://fonts.googleapis.com'))
  }
})

test('consultas excedentes são bloqueadas antes do banco e health permanece disponível', async t => {
  t.mock.method(console, 'log', () => {})
  const query = mockMethod(t, prisma.noticia, 'findMany', async () => [])
  const url = await serve(t, createApp())
  for (let i = 0; i < 120; i++) {
    const res = await fetch(url + '/api/noticias')
    assert.equal(res.status, 200)
    await res.json()
  }
  const blocked = await fetch(url + '/api/noticias', { headers: { 'X-Forwarded-For': '203.0.113.1' } })
  assert.equal(blocked.status, 429)
  assert.ok(Number(blocked.headers.get('retry-after')) > 0)
  assert.equal(query.mock.callCount(), 120)
  assert.equal((await fetch(url + '/api/health')).status, 200)
})

test('filtros extensos ou estruturados são rejeitados antes de consultar o banco', async t => {
  const query = mockMethod(t, prisma.noticia, 'findMany', async () => [])
  const url = await serve(t, createApp())
  for (const filter of ['q=' + 'a'.repeat(201), 'q[x]=valor', 'q=a&q=b', 'categoria=' + 'a'.repeat(201)]) {
    assert.equal((await fetch(url + '/api/noticias?' + filter)).status, 400)
  }
  assert.equal(query.mock.callCount(), 0)
})

test('logs de acesso não registram termos de busca nem cabeçalhos privados', async t => {
  const log = t.mock.method(console, 'log', () => {})
  const url = await serve(t, createApp())
  await fetch(url + '/api/health?q=segredo-busca', { headers: { Authorization: 'Bearer segredo-token' } })
  const output = JSON.stringify(log.mock.calls.map(call => call.arguments))
  assert.ok(output.includes('/api/health'))
  assert.ok(!output.includes('segredo'))
  assert.ok(!output.includes('?q='))
})
