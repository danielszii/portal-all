import test from 'node:test'
import assert from 'node:assert/strict'
import { createApp } from '../src/app.js'
import { prisma } from '../src/db/prisma.js'
import type { Cadeira, SearchPage } from '../src/types/index.js'
import { mockMethod } from './mock-method.js'
import { serve } from './serve.js'
import type { TestContext } from 'node:test'

async function searchApp(t: TestContext) {
  mockMethod(t, prisma.cadeira, 'findMany', async () => [1, 12, 112].map(numero => ({
    numero, patrono: { nome: numero === 12 ? 'Álvaro da Academia' : 'Patrono da Academia' },
    ocupacoes: numero === 12 ? [
      { id: 'fundador', fundador: true, vigente: false, inicioAno: 2000, fimAno: 2010,
        academico: { nome: 'Conceição', inMemoriam: false, obras: [], producoes: [] } },
      { id: 'titular', fundador: false, vigente: true, inicioAno: 2011,
        academico: { nome: 'João', inMemoriam: false, obras: [], producoes: [] } },
    ] : [],
  })))
  mockMethod(t, prisma, '$transaction', async callback => callback({
    $queryRaw: async (query: { sql: string }) => query.sql.startsWith('SELECT count') ? [{ total: 0 }] : [],
  }))
  return serve(t, createApp())
}

test('buscas públicas encontram o número exato em decimal e romano sem alterar o contrato', async t => {
  const url = await searchApp(t)
  for (const term of ['12', '012', ' XII ', 'xii']) {
    const query = '?q=' + encodeURIComponent(term)
    const list = await fetch(url + '/api/cadeiras' + query)
    const search = await fetch(url + '/api/busca' + query)
    assert.equal(list.status, 200)
    assert.equal(search.status, 200)
    const chairs = await list.json() as Cadeira[]
    assert.deepEqual(chairs.map(c => c.number), ['XII'], term)
    const result = await search.json() as SearchPage
    assert.deepEqual(result, {
      cadeiras: [{ number: 'XII', patron: 'Álvaro da Academia', holder: 'João' }],
      noticias: [], acervo: [], page: 1, totalPages: 1,
    })
  }
  for (const term of ['0', '4000', '12abc', 'IIII']) {
    assert.deepEqual(await (await fetch(url + '/api/cadeiras?q=' + term)).json(), [], term)
    const result = await (await fetch(url + '/api/busca?q=' + term)).json() as SearchPage
    assert.deepEqual(result.cadeiras, [], term)
  }
})

test('buscas mantêm patrono, titular e fundador sem acentos e combinam número com situação', async t => {
  const url = await searchApp(t)
  for (const term of ['ALVARO', 'joao', 'conceicao']) {
    const chairs = await (await fetch(url + '/api/cadeiras?search=' + term)).json() as Cadeira[]
    const result = await (await fetch(url + '/api/busca?q=' + term)).json() as SearchPage
    assert.deepEqual(chairs.map(c => c.number), ['XII'], term)
    assert.deepEqual(result.cadeiras.map(c => c.number), ['XII'], term)
  }
  assert.deepEqual(await (await fetch(url + '/api/cadeiras?q=12&status=Vaga')).json(), [])
  const vacant = await (await fetch(url + '/api/cadeiras?q=112&status=Vaga')).json() as Cadeira[]
  assert.deepEqual(vacant.map(c => c.number), ['CXII'])
})

test('busca global pagina depois de filtrar e não repete cadeiras após a última página', async t => {
  const url = await searchApp(t)
  const path = url + '/api/busca?q=academia&pageSize=2&page='
  const first = await (await fetch(path + '1')).json() as SearchPage
  const second = await (await fetch(path + '2')).json() as SearchPage
  const beyond = await (await fetch(path + '3')).json() as SearchPage
  assert.equal(first.totalPages, 2)
  assert.deepEqual(first.cadeiras.map(c => c.number), ['I', 'XII'])
  assert.deepEqual(second.cadeiras.map(c => c.number), ['CXII'])
  assert.deepEqual(beyond.cadeiras, [])
  const numeric = await (await fetch(url + '/api/busca?q=12&pageSize=1&page=2')).json() as SearchPage
  assert.equal(numeric.totalPages, 1)
  assert.deepEqual(numeric.cadeiras, [])
})

test('termo vazio preserva a listagem de cadeiras e os resultados vazios da busca global', async t => {
  const url = await searchApp(t)
  const chairs = await (await fetch(url + '/api/cadeiras?q=%20')).json() as Cadeira[]
  assert.equal(chairs.length, 3)
  assert.deepEqual(await (await fetch(url + '/api/busca?q=%20')).json(), {
    cadeiras: [], noticias: [], acervo: [], page: 1, totalPages: 1,
  })
})
