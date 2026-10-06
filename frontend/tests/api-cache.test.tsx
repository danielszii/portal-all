import test from 'node:test'
import assert from 'node:assert/strict'
import { fetchSearchPage } from '../src/services/api.js'

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
