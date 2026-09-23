import test from 'node:test'
import assert from 'node:assert/strict'
import { prisma } from '../src/db/prisma.js'
import { databaseReady } from '../src/services/readiness.service.js'
import { createApp } from '../src/app.js'
import { serve } from './serve.js'
import { mockMethod } from './mock-method.js'

test('readiness retorna 200 com banco acessível e 503 sem vazar a falha', async t => {
  let fail = false
  mockMethod(t, prisma, '$queryRaw', async () => {
    if (fail) throw new Error('credenciais e endereço internos')
    return [{ value: 1 }]
  })
  const url = await serve(t, createApp())
  const ok = await fetch(url + '/api/ready')
  assert.equal(ok.status, 200)
  assert.equal(ok.headers.get('cache-control'), 'no-store')
  assert.deepEqual(await ok.json(), { status: 'ok', database: 'up' })
  fail = true
  const down = await fetch(url + '/api/ready')
  assert.equal(down.status, 503)
  assert.deepEqual(await down.json(), { status: 'unavailable', database: 'down' })
  assert.equal((await fetch(url + '/api/health')).status, 200)
  fail = false
  assert.equal((await fetch(url + '/api/ready')).status, 200)
})

test('readiness limita espera e compartilha consulta lenta até recuperar', async t => {
  let finish!: (value: unknown) => void
  const query = mockMethod(t, prisma, '$queryRaw', () => new Promise(resolve => { finish = resolve }))
  const results = await Promise.all([databaseReady(10), databaseReady(10)])
  assert.deepEqual(results, [false, false])
  assert.equal(query.mock.callCount(), 1)
  const recovery = databaseReady(1000)
  finish([])
  assert.equal(await recovery, true)
})
