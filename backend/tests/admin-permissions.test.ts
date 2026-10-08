import test from 'node:test'
import assert from 'node:assert/strict'
import { adminProfiles, permissionsFor, permissionForRequest } from '../src/domain/admin-permissions.js'
import { createApp } from '../src/app.js'
import { prisma } from '../src/db/prisma.js'
import { cookieName } from '../src/middlewares/admin-auth.middleware.js'
import { envConfig } from '../src/config/env.config.js'
import { mockMethod } from './mock-method.js'
import { serve } from './serve.js'

test('perfis combinados somam permissões sem conceder administração ou exclusão', () => {
  const combined = permissionsFor(['EDITOR', 'SECRETARIA'])
  assert.ok(combined.includes('conteudo:editar'))
  assert.ok(combined.includes('instituicao:editar'))
  assert.ok(!combined.includes('registros:excluir'))
  assert.ok(!combined.includes('contas:gerenciar'))
  for (const value of [undefined, null, [], ['admin'], ['EDITOR', 'EDITOR'], ['EDITOR', 'DESCONHECIDO']]) assert.deepEqual(permissionsFor(value), [])
  for (const [method, path] of [['GET', '/novo-modulo'], ['DELETE', '/auditoria/1'], ['PUT', '/uploads'], ['DELETE', '/contas/1'], ['PATCH', '/noticias/1']]) {
    assert.equal(permissionForRequest(method, path), null)
  }
})

test('API bloqueia todos os módulos não autorizados antes de ler corpos ou executar operações', async t => {
  let perfis: unknown = ['CONSULTA']
  const headers = { Cookie: `${cookieName}=${'a'.repeat(64)}`, Origin: new URL(envConfig.frontendUrl).origin, 'X-CSRF-Token': 'teste', 'Content-Type': 'application/json' }
  mockMethod(t, prisma.sessaoAdmin, 'findUnique', async () => ({ administrador: { id: 'test', email: 'test@example.test', ativo: true, perfis }, csrfToken: 'teste', expiraEm: new Date(Date.now() + 60000) }))
  const base = await serve(t, createApp())
  const cases: [string, string, readonly string[]][] = [
    ['POST', '/noticias', ['SECRETARIA', 'CONSULTA']], ['PUT', '/acervo/1', ['SECRETARIA', 'CONSULTA']],
    ['GET', '/agenda', ['SECRETARIA']], ['GET', '/galeria', ['SECRETARIA']],
    ['POST', '/cadeiras', ['EDITOR', 'CONSULTA']], ['PUT', '/cadeiras/1', ['EDITOR', 'CONSULTA']],
    ['POST', '/cadeiras/1/encerrar', ['EDITOR', 'CONSULTA']], ['GET', '/academicos', ['EDITOR']], ['GET', '/patronos', ['EDITOR']],
    ['PUT', '/instituicao', ['EDITOR', 'CONSULTA']], ['POST', '/gestoes', ['EDITOR', 'CONSULTA']],
    ['PUT', '/gestoes/1/mandatos/1', ['EDITOR', 'CONSULTA']], ['GET', '/auditoria', ['EDITOR', 'SECRETARIA']],
    ['GET', '/contas', ['EDITOR', 'SECRETARIA', 'CONSULTA']], ['POST', '/contas', ['EDITOR', 'SECRETARIA', 'CONSULTA']],
    ['PUT', '/contas/1', ['EDITOR', 'SECRETARIA', 'CONSULTA']],
    ...['noticias/1', 'acervo/1', 'agenda/1', 'galeria/1', 'academicos/1', 'patronos/1', 'gestoes/1', 'gestoes/1/mandatos/1'].map(path => ['DELETE', '/' + path, ['EDITOR', 'SECRETARIA', 'CONSULTA']] as [string, string, string[]]),
  ]
  for (const profile of adminProfiles) {
    perfis = [profile]
    for (const [method, path, denied] of cases) {
      if (!denied.includes(profile)) continue
      const response = await fetch(base + '/api/admin' + path, { method, headers, ...(!['GET', 'HEAD'].includes(method) && { body: '{invalid json' }) })
      assert.equal(response.status, 403, `${profile}: ${method} ${path}`)
    }
  }
  for (const [profile, mime] of [['CONSULTA', 'image/png'], ['CONSULTA', 'application/pdf'], ['SECRETARIA', 'application/pdf; charset=binary']]) {
    perfis = [profile]
    assert.equal((await fetch(base + '/api/admin/uploads', { method: 'POST', headers: { ...headers, 'Content-Type': mime }, body: 'invalid' })).status, 403)
  }
  perfis = undefined
  assert.equal((await fetch(base + '/api/admin/noticias', { headers })).status, 403)
})
