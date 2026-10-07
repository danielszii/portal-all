import test from 'node:test'
import assert from 'node:assert/strict'
import { createApp } from '../src/app.js'
import { serve } from './serve.js'
import { prisma } from '../src/db/prisma.js'
import { mockMethod } from './mock-method.js'
import { envConfig } from '../src/config/env.config.js'

test('respostas incluem proteção do navegador sem bloquear fontes e PDF usados pelo portal', async t => {
  const url = await serve(t, createApp())
  for (const path of ['/api/health', '/api/inexistente']) {
    const res = await fetch(url + path)
    assert.equal(res.headers.get('x-powered-by'), null)
    assert.equal(res.headers.get('x-content-type-options'), 'nosniff')
    assert.equal(res.headers.get('x-frame-options'), 'DENY')
    assert.equal(res.headers.get('referrer-policy'), 'strict-origin-when-cross-origin')
    assert.equal(res.headers.get('permissions-policy'), 'camera=(), microphone=(), geolocation=()')
    const policy = res.headers.get('content-security-policy') ?? ''
    assert.ok(policy.includes("script-src 'self'"))
    assert.ok(policy.includes("frame-ancestors 'none'"))
    assert.ok(policy.includes("frame-src 'self' https://docs.google.com"))
    assert.ok(policy.includes('https://fonts.googleapis.com'))
  }
})

test('CORS rejeita origens não permitidas antes do banco, inclusive no contato e no preflight', async t => {
  const create = mockMethod(t, prisma.contatoMensagem, 'create', () => { throw new Error('Não persistir') })
  const query = mockMethod(t, prisma.noticia, 'findMany', () => { throw new Error('Não consultar') })
  const url = await serve(t, createApp())
  for (const origin of ['https://externo.example', 'null', envConfig.frontendUrl + '.externo.example',
    envConfig.frontendUrl + '/caminho', envConfig.frontendUrl + ', https://externo.example']) {
    for (const [path, method] of [['/api/noticias', 'GET'], ['/api/contato', 'POST'], ['/api/admin/uploads', 'OPTIONS']]) {
      const res = await fetch(url + path, { method, headers: { Origin: origin } })
      assert.equal(res.status, 403)
      assert.equal(res.headers.get('access-control-allow-origin'), null)
      assert.deepEqual(await res.json(), { status: 'error', statusCode: 403, error: 'Origem não autorizada.' })
    }
  }
  assert.equal(create.mock.callCount(), 0)
  assert.equal(query.mock.callCount(), 0)
})

test('CORS permite a origem configurada e consultas sem Origin, sem dispensar autenticação', async t => {
  const url = await serve(t, createApp())
  const headers = { Origin: envConfig.frontendUrl }
  const allowed = await fetch(url + '/api/health', { headers })
  assert.equal(allowed.status, 200)
  assert.equal(allowed.headers.get('access-control-allow-origin'), envConfig.frontendUrl)
  assert.equal(allowed.headers.get('access-control-allow-credentials'), 'true')
  assert.match(allowed.headers.get('vary') ?? '', /Origin/)
  const preflight = await fetch(url + '/api/admin/uploads', {
    method: 'OPTIONS', headers: { ...headers, 'Access-Control-Request-Method': 'POST', 'Access-Control-Request-Headers': 'content-type,x-csrf-token' },
  })
  assert.equal(preflight.status, 204)
  assert.match(preflight.headers.get('access-control-allow-methods') ?? '', /POST/)
  assert.match(preflight.headers.get('access-control-allow-headers') ?? '', /X-CSRF-Token/i)
  const noOrigin = await fetch(url + '/api/health')
  assert.equal(noOrigin.status, 200)
  assert.equal(noOrigin.headers.get('access-control-allow-origin'), null)
  assert.equal((await fetch(url + '/api/admin/noticias')).status, 401)
  assert.equal((await fetch(url + '/api/admin/auth/login', { method: 'POST' })).status, 403)
})

test('contato limita envios concorrentes antes de gravar e não expõe as mensagens recebidas', async t => {
  const data = { nome: 'Visitante', email: 'visitante@example.test', assunto: 'Informação', mensagem: 'Mensagem de teste' }
  const create = mockMethod(t, prisma.contatoMensagem, 'create', async () => ({ ...data, id: 'contato-teste', dataEnvio: new Date() }))
  const url = await serve(t, createApp())
  const responses = await Promise.all(Array.from({ length: 6 }, () => fetch(url + '/api/contato', {
    method: 'POST', headers: { Origin: envConfig.frontendUrl, 'Content-Type': 'application/json' }, body: JSON.stringify(data),
  })))
  assert.deepEqual(responses.map(res => res.status).sort(), [201, 201, 201, 201, 201, 429])
  assert.equal(create.mock.callCount(), 5)
  assert.ok(Number(responses.find(res => res.status === 429)?.headers.get('retry-after')) > 0)
  for (const res of responses) assert.doesNotMatch(await res.text(), /visitante@example\.test|Mensagem de teste/)
  assert.equal((await fetch(url + '/api/contato')).status, 404)
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
