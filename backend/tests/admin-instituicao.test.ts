import test from 'node:test'
import assert from 'node:assert/strict'
import { institutionInput, mandateInput, termInput, validateBoard } from '../src/services/admin-instituicao.service.js'
import { auditFilters } from '../src/services/admin-audit.service.js'
import { prisma } from '../src/db/prisma.js'
import { createApp } from '../src/app.js'
import { cookieName } from '../src/middlewares/admin-auth.middleware.js'
import { envConfig } from '../src/config/env.config.js'
import { serve } from './serve.js'
import { mockMethod } from './mock-method.js'

const institution = { nome: 'Academia', historia: 'História', missao: 'Missão' }
test('informações institucionais validam campos, limites e dados opcionais', () => {
  const result = institutionInput({ ...institution, nome: ' Academia ', email: ' CONTATO@EXAMPLE.TEST ', fundacaoAno: 1964 })
  assert.equal(result.nome, 'Academia')
  assert.equal(result.email, 'contato@example.test')
  assert.equal(result.telefone, null)
  for (const fields of [{ nome: '' }, { historia: ' ' }, { missao: 4 }, { email: 'invalido' }, { telefone: 'x'.repeat(51) },
    { fundacaoAno: 0 }, { fundacaoAno: 9999 }, { id: 'outra-instituicao' }, { historia: 'x'.repeat(100001) }]) {
    assert.throws(() => institutionInput({ ...institution, ...fields }))
  }
})

test('períodos de gestão e mandato exigem anos e datas civis válidos', () => {
  assert.deepEqual(termInput({ inicioAno: 2020 }), { inicioAno: 2020, fimAno: null })
  for (const data of [{ inicioAno: 0 }, { inicioAno: '2020' }, { inicioAno: 2020, fimAno: 2019 }, { inicioAno: 10000 }]) {
    assert.throws(() => termInput(data))
  }
  const person = { academicoId: 'id', cargo: '  Primeiro   secretário ' }
  assert.equal(mandateInput(person).cargo, 'Primeiro secretário')
  for (const fields of [{ cargo: '' }, { academicoId: null }, { inicioEm: '2026-02-30' }, { inicioEm: '2026-01-01T00:00:00Z' },
    { inicioEm: '2026-02-01', fimEm: '2026-01-31' }, { gestaoId: 'outra' }]) {
    assert.throws(() => mandateInput({ ...person, ...fields }))
  }
})

test('diretoria impede cargos simultâneos equivalentes e permite sucessões sem apagar o histórico', () => {
  const term = { inicioAno: 2026, fimAno: 2027 }
  const member = (cargo: string, inicioEm: string | null, fimEm: string | null) => mandateInput({ academicoId: 'id', cargo, inicioEm, fimEm })
  assert.throws(() => validateBoard(term, [member('Secretário', null, null), member('SECRETARIO', '2026-06-01', null)]), /cargo/)
  assert.throws(() => validateBoard(term, [member('Presidente', null, '2026-06-30'), member('Presidente', '2026-06-30', null)]), /cargo/)
  assert.doesNotThrow(() => validateBoard(term, [member('Presidente', null, '2026-06-30'), member('Presidente', '2026-07-01', null)]))
  assert.doesNotThrow(() => validateBoard(term, [member('Presidente', null, null), member('Secretário', null, null)]))
  for (const period of [['2025-12-31', null], [null, '2028-01-01'], ['2028-01-01', null]] as const) {
    assert.throws(() => validateBoard(term, [member('Presidente', period[0], period[1])]), /dentro dos anos/)
  }
})

test('auditoria reconhece os novos recursos institucionais', () => {
  for (const recurso of ['INSTITUICAO', 'GESTAO', 'MANDATO']) assert.equal(auditFilters({ recurso }).where.recurso, recurso)
})

test('todas as rotas institucionais exigem sessão e protegem suas escritas com origem e CSRF', async t => {
  const database = mockMethod(t, prisma, '$transaction', () => { throw new Error('A escrita não deve chegar ao banco') })
  const base = await serve(t, createApp())
  const paths = [
    ['GET', '/instituicao'], ['PUT', '/instituicao'], ['GET', '/gestoes'], ['POST', '/gestoes'],
    ['GET', '/gestoes/id'], ['PUT', '/gestoes/id'], ['DELETE', '/gestoes/id'],
    ['POST', '/gestoes/id/mandatos'], ['PUT', '/gestoes/id/mandatos/id'], ['DELETE', '/gestoes/id/mandatos/id'],
  ]
  for (const [method, path] of paths) {
    assert.equal((await fetch(base + '/api/admin' + path, { method })).status, 401, path)
  }
  mockMethod(t, prisma.sessaoAdmin, 'findUnique', async () => ({
    administrador: { id: 'admin', email: 'admin@example.test', ativo: true },
    expiraEm: new Date(Date.now() + 60000), csrfToken: 'csrf',
  }))
  for (const [method, path] of paths.filter(([method]) => method !== 'GET')) {
    const headers = { Cookie: `${cookieName}=${'a'.repeat(64)}`, 'Content-Type': 'application/json' }
    assert.equal((await fetch(base + '/api/admin' + path, { method, headers, body: '{}' })).status, 403)
    assert.equal((await fetch(base + '/api/admin' + path, { method, headers: { ...headers, Origin: envConfig.frontendUrl, 'X-CSRF-Token': 'incorreto' }, body: '{}' })).status, 403)
  }
  assert.equal(database.mock.callCount(), 0)
})
