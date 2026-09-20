import { mockMethod } from './mock-method.js'
import test from 'node:test'
import assert from 'node:assert/strict'
import { dataInstitucional, findInstituicao } from '../src/repositories/instituicao.repository.js'
import { prisma } from '../src/db/prisma.js'

test('dia institucional usa Fortaleza inclusive na virada de ano UTC', () => {
  assert.equal(dataInstitucional(new Date('2027-01-01T02:59:59Z')).toISOString(), '2026-12-31T00:00:00.000Z')
  assert.equal(dataInstitucional(new Date('2027-01-01T03:00:00Z')).toISOString(), '2027-01-01T00:00:00.000Z')
})

test('consulta da diretoria exige início e fim compatíveis com o dia civil', async t => {
  mockMethod(t, prisma.instituicao, 'findUnique', async () => null)
  const query = mockMethod(t, prisma.gestao, 'findFirst', async () => ({
    inicioAno: 2026, fimAno: 2027,
    mandatos: [{ cargo: 'Presidente', academico: { nome: 'Maria' }, inicioEm: new Date('2026-01-01T00:00:00Z') }],
  }))
  const result = await findInstituicao(new Date('2026-09-20T23:00:00-03:00'))
  const hoje = new Date('2026-09-20T00:00:00Z')
  const args = query.mock.calls[0].arguments[0]
  assert.deepEqual(args?.include?.mandatos?.where, { AND: [
    { OR: [{ inicioEm: null }, { inicioEm: { lte: hoje } }] },
    { OR: [{ fimEm: null }, { fimEm: { gte: hoje } }] },
  ] })
  assert.deepEqual(result.gestao?.diretoria, [{ cargo: 'Presidente', nome: 'Maria', posse: '2026' }])
})
