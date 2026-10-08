import test from 'node:test'
import assert from 'node:assert/strict'
import { fetchSearchPage, fetchInstituicao, invalidateInstituicao } from '../src/services/api.js'

test('consultas públicas simultâneas e repetidas reutilizam a mesma resposta', async t => {
  const originalFetch = globalThis.fetch
  let calls = 0
  t.after(() => { globalThis.fetch = originalFetch })
  globalThis.fetch = async () => {
    calls++
    await new Promise(resolve => setTimeout(resolve, 5))
    return Response.json({ cadeiras: [], noticias: [], acervo: [], page: 1, totalPages: 1 })
  }

  const first = fetchSearchPage('cache-publico-unico', 1)
  const second = fetchSearchPage('cache-publico-unico', 1)
  assert.deepEqual(await first, await second)
  await fetchSearchPage('cache-publico-unico', 1)
  assert.equal(calls, 1)
})

test('consulta anterior à edição não substitui a resposta institucional nova no cache', async t => {
  invalidateInstituicao()
  t.after(invalidateInstituicao)
  let finishOld!: (response: Response) => void
  let finishNew!: (response: Response) => void
  let calls = 0
  t.mock.method(globalThis, 'fetch', async () => {
    calls++
    return new Promise<Response>(resolve => { if (calls === 1) finishOld = resolve; else finishNew = resolve })
  })
  const old = fetchInstituicao()
  invalidateInstituicao()
  const current = fetchInstituicao()
  finishOld(Response.json({ info: { nome: 'Antigo' }, gestao: null }))
  await old
  const shared = fetchInstituicao()
  assert.equal(calls, 2)
  finishNew(Response.json({ info: { nome: 'Atual' }, gestao: null }))
  assert.deepEqual(await shared, await current)
  assert.equal((await fetchInstituicao()).info?.nome, 'Atual')
  assert.equal(calls, 2)
})
