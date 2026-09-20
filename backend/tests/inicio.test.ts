import { mockMethod } from './mock-method.js'
import test from 'node:test'
import assert from 'node:assert/strict'
import { prisma } from '../src/db/prisma.js'
import { findInicioCadeiras, findInicioNoticias, findInicioAcervo } from '../src/repositories/inicio.repository.js'

test('home mantém total de cadeiras, pula vagas e limita os cartões a quatro', async t => {
  const rows = Array.from({ length: 7 }, (_, i) => ({
    numero: i + 1, patrono: { nome: 'Patrono' }, ocupacoes: i === 0 ? [] : [{
      vigente: i !== 1, inicioAno: 2000,
      academico: { nome: `Pessoa ${i}`, fotoUrl: null, inMemoriam: i === 1 },
    }],
  }))
  const query = mockMethod(t, prisma.cadeira, 'findMany', async () => rows)
  const result = await findInicioCadeiras()
  assert.equal(result.total, 7)
  assert.deepEqual(result.items.map(c => c.number), ['II', 'III', 'IV', 'V'])
  assert.equal(result.items[0].status, 'In memoriam')
  assert.equal(result.items[1].status, 'Titular em exercício')
  assert.ok(!JSON.stringify(query.mock.calls[0].arguments[0]).includes('biografia'))
})

test('notícias da home usam limite no banco e não selecionam conteúdo completo', async t => {
  const query = mockMethod(t, prisma.noticia, 'findMany', async () => [
    { id: 1, titulo: 'Notícia', publicadoEm: new Date('2026-09-20T12:00:00Z') },
  ])
  const result = await findInicioNoticias()
  const args = query.mock.calls[0].arguments[0]
  assert.equal(args?.take, 3)
  assert.equal(args?.where?.status, 'PUBLICADO')
  assert.ok(args?.where?.publicadoEm)
  assert.deepEqual(args?.select, { id: true, titulo: true, publicadoEm: true })
  assert.deepEqual(result, [{ id: 1, titulo: 'Notícia', data: '20 SET 2026' }])
})

test('home conta todo o acervo publicado mas consulta somente três destaques', async t => {
  const count = mockMethod(t, prisma.acervoItem, 'count', async () => 20)
  const query = mockMethod(t, prisma.acervoItem, 'findMany', async () => [
    { id: 'livro', titulo: 'Livro', edicao: null, ano: 2026, cor: 'navy', autoriaTexto: 'Autora' },
  ])
  mockMethod(t, prisma, '$transaction', async (queries: Promise<unknown>[]) => Promise.all(queries))
  const result = await findInicioAcervo()
  assert.equal(result.total, 20)
  assert.equal(result.items[0].title, 'Livro')
  assert.deepEqual(count.mock.calls[0].arguments[0], { where: { status: 'PUBLICADO' } })
  assert.equal(query.mock.calls[0].arguments[0]?.take, 3)
  assert.equal(query.mock.calls[0].arguments[0]?.where?.status, 'PUBLICADO')
})
