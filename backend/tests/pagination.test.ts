import test from 'node:test'
import assert from 'node:assert/strict'
import { parsePagination, foldSearch } from '../src/repositories/catalog-query.js'
import { createApp } from '../src/app.js'
import { serve } from './serve.js'

test('paginação é opt-in e limita tamanho e valores inválidos', () => {
  assert.equal(parsePagination({}), undefined)
  assert.deepEqual(parsePagination({ page: '2' }), { page: 2, pageSize: 12 })
  assert.deepEqual(parsePagination({ pageSize: '50' }), { page: 1, pageSize: 50 })
  for (const value of ['0', '-1', '1.5', 'abc', '', ['1', '2'], '9007199254740992']) {
    assert.throws(() => parsePagination({ page: value }))
  }
  assert.throws(() => parsePagination({ pageSize: '51' }))
  assert.equal(foldSearch('MEMÓRIAS João AÇÃO'), 'memorias joao acao')
  assert.equal(foldSearch('memo\u0301rias'), 'memorias')
})

test('paginação inválida retorna 400 nas duas listagens antes de consultar o banco', async t => {
  const url = await serve(t, createApp())
  for (const path of ['/api/noticias', '/api/acervo']) {
    for (const query of ['page=0', 'page=-1', 'page=1.5', 'pageSize=51', 'page=1&page=2']) {
      assert.equal((await fetch(`${url}${path}?${query}`)).status, 400)
    }
  }
})
