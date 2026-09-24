import test from 'node:test'
import assert from 'node:assert/strict'
import { adminDestination, AuthError, fetchAdminSession, loginAdmin, logoutAdmin } from '../../frontend/src/services/auth.js'

const session = { user: { id: 'admin-id', email: 'admin@example.test' }, csrfToken: 'a'.repeat(64), expiraEm: '2099-01-01T00:00:00.000Z' }

test('login do frontend envia a senha ao backend e usa o cookie de sessão', async t => {
  t.mock.method(globalThis, 'fetch', async (path: string, init: RequestInit & { cache?: string }) => {
    assert.equal(path, '/api/admin/auth/login')
    assert.equal(init.method, 'POST')
    assert.equal(init.credentials, 'include')
    assert.equal(init.cache, 'no-store')
    assert.deepEqual(JSON.parse(String(init.body)), { email: 'admin@example.test', password: ' senha de teste ', remember: true })
    return Response.json(session)
  })
  assert.deepEqual(await loginAdmin(' admin@example.test ', ' senha de teste ', true), session)
})

test('login inválido ou resposta incompleta não autorizam acesso', async t => {
  const fetch = t.mock.method(globalThis, 'fetch', async () => Response.json({ error: 'E-mail ou senha inválidos.' }, { status: 401 }))
  await assert.rejects(loginAdmin('inexistente@example.test', 'errada', false), error => error instanceof AuthError && error.status === 401)
  fetch.mock.mockImplementation(async () => Response.json({ user: { email: 'forjado@example.test' } }))
  await assert.rejects(loginAdmin('forjado@example.test', 'errada', false), /Resposta de autenticação inválida/)
})

test('restauração da sessão depende de /me e distingue indisponibilidade de sessão expirada', async t => {
  const fetch = t.mock.method(globalThis, 'fetch', async (path: string) => {
    assert.equal(path, '/api/admin/auth/me')
    return Response.json(session)
  })
  assert.deepEqual(await fetchAdminSession(), session)
  fetch.mock.mockImplementation(async () => Response.json({}, { status: 401 }))
  assert.equal(await fetchAdminSession(), null)
  fetch.mock.mockImplementation(async () => { throw new TypeError('Failed to fetch') })
  await assert.rejects(fetchAdminSession(), /Não foi possível acessar o servidor/)
  fetch.mock.mockImplementation(async () => Response.json({ ...session, expiraEm: '2000-01-01T00:00:00Z' }))
  await assert.rejects(fetchAdminSession(), /Resposta de autenticação inválida/)
})

test('logout envia CSRF e não oculta falhas de revogação', async t => {
  const fetch = t.mock.method(globalThis, 'fetch', async (path: string, init: RequestInit) => {
    assert.equal(path, '/api/admin/auth/logout')
    assert.equal(init.method, 'POST')
    assert.equal(init.credentials, 'include')
    assert.equal(new Headers(init.headers).get('X-CSRF-Token'), session.csrfToken)
    return new Response(null, { status: 204 })
  })
  await logoutAdmin(session.csrfToken)
  fetch.mock.mockImplementation(async () => Response.json({}, { status: 401 }))
  await logoutAdmin(session.csrfToken)
  fetch.mock.mockImplementation(async () => Response.json({ error: 'Verificação CSRF inválida.' }, { status: 403 }))
  await assert.rejects(logoutAdmin(session.csrfToken), error => error instanceof AuthError && error.status === 403)
})

test('login aceita apenas destinos internos do administrativo', () => {
  for (const path of ['/admin', '/admin/noticias', '/admin/acervo', '/admin/agenda', '/admin/membros']) assert.equal(adminDestination(path), path)
  for (const path of ['https://externo.example', '//externo.example', '/admin/../login', '/admin?to=externo', null, {}]) assert.equal(adminDestination(path), '/admin')
})

test('frontend informa o tempo de espera quando o login é limitado', async t => {
  t.mock.method(globalThis, 'fetch', async () => Response.json({ error: 'Muitas requisições.' }, { status: 429, headers: { 'Retry-After': '360' } }))
  await assert.rejects(loginAdmin('admin@example.test', 'senha', false), error => error instanceof AuthError && error.status === 429 && error.message.includes('6 minuto(s)'))
})
