import test from 'node:test'
import assert from 'node:assert/strict'
import { auditFilters, changedFields } from '../src/services/admin-audit.service.js'
import { prisma } from '../src/db/prisma.js'
import { createApp } from '../src/app.js'
import { serve } from './serve.js'
import { mockMethod } from './mock-method.js'
import { cookieName } from '../src/middlewares/admin-auth.middleware.js'

test('auditoria exige sessão e valida filtros antes de consultar o histórico', async t => {
  mockMethod(t, prisma.sessaoAdmin, 'findUnique', async () => ({ administrador: { id: 'admin', email: 'admin@example.test', ativo: true }, expiraEm: new Date(Date.now() + 60000) }))
  const query = mockMethod(t, prisma, '$transaction', () => { throw new Error('Não consultar') })
  const base = await serve(t, createApp())
  assert.equal((await fetch(base + '/api/admin/auditoria')).status, 401)
  const headers = { Cookie: `${cookieName}=${'a'.repeat(64)}` }
  for (const filter of ['pageSize=51', 'page=0', 'acao=APAGAR_TUDO', 'recurso=CONTATO', 'administradorId[x]=a', 'recurso=NOTICIA&recurso=EVENTO', 'inicio=invalido', 'fim=2026-01-01T00:00:00Z&inicio=2026-02-01T00:00:00Z', 'campoDesconhecido=x']) {
    assert.equal((await fetch(base + '/api/admin/auditoria?' + filter, { headers })).status, 400, filter)
  }
  assert.equal(query.mock.callCount(), 0)
})

test('filtros de auditoria usam IDs exatos e datas com fuso, e diferenças não copiam os valores', () => {
  const filters = auditFilters({ administradorId: 'a', recurso: 'NOTICIA', registroId: '10', acao: 'EDITAR', inicio: '2026-09-28T00:00:00-03:00', fim: '2026-09-28T23:59:59-03:00' })
  assert.equal(filters.pageSize, 20)
  assert.equal(auditFilters({ page: '2' }).pageSize, 20)
  assert.equal(auditFilters({ pageSize: '5' }).pageSize, 5)
  assert.equal(filters.where.registroId, '10')
  assert.equal(filters.where.administradorId, 'a')
  assert.deepEqual(filters.where.criadoEm, { gte: new Date('2026-09-28T03:00:00Z'), lte: new Date('2026-09-29T02:59:59Z') })
  const before = { conteudo: 'Texto antigo privado', titulo: 'Mantido', publicadoEm: new Date('2026-01-01') }
  const after = { conteudo: 'Texto novo privado', titulo: 'Mantido', publicadoEm: new Date('2026-01-01') }
  assert.deepEqual(changedFields(before, after, ['conteudo', 'titulo', 'publicadoEm']), ['conteudo'])
})
