import test from 'node:test'
import assert from 'node:assert/strict'
import { serve } from '../serve.js'
import { permissionsFor, type AdminProfile } from '../../src/domain/admin-permissions.js'

const schema = process.env.INTEGRATION_SCHEMA ?? ''
assert.match(schema, /^portal_test_[a-f0-9]{32}$/)
assert.equal(new URL(process.env.DATABASE_URL!).searchParams.get('schema'), schema)
const { prisma } = await import('../../src/db/prisma.js')
const { createApp } = await import('../../src/app.js')
const { hashPassword } = await import('../../src/services/admin-auth.service.js')
const { editAccount } = await import('../../src/services/admin-accounts.service.js')
const { envConfig } = await import('../../src/config/env.config.js')

test('perfis, contas e revogação com PostgreSQL real', async t => {
  const accountIds: string[] = []
  let newsId: number | undefined
  let termId: string | undefined
  t.after(async () => {
    if (newsId) await prisma.noticia.deleteMany({ where: { id: newsId } })
    if (termId) await prisma.gestao.deleteMany({ where: { id: termId } })
    await prisma.administrador.deleteMany({ where: { id: { in: accountIds } } })
    await prisma.$disconnect()
  })
  const base = await serve(t, createApp())
  const origin = new URL(envConfig.frontendUrl).origin
  const password = 'Senha exclusiva dos perfis 2026'
  const root = await prisma.administrador.create({ data: { email: 'profiles-root@example.test', senhaHash: await hashPassword(password), perfis: ['ADMINISTRADOR'] } })
  accountIds.push(root.id)
  const connect = async (email: string, secret = password) => {
    const res = await fetch(base + '/api/admin/auth/login', { method: 'POST', headers: { Origin: origin, 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password: secret }) })
    assert.equal(res.status, 200)
    const session = await res.json() as { csrfToken: string; user: { perfis: AdminProfile[]; permissoes: string[] } }
    assert.deepEqual(session.user.permissoes, permissionsFor(session.user.perfis))
    const headers = { Origin: origin, Cookie: res.headers.get('set-cookie')!.split(';')[0], 'Content-Type': 'application/json', 'X-CSRF-Token': session.csrfToken }
    return async (path: string, method = 'GET', body?: unknown, expected = 200) => {
      const response = await fetch(base + '/api/admin' + path, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) })
      const data: any = response.status === 204 ? null : await response.json()
      assert.equal(response.status, expected, `${method} ${path}: ${JSON.stringify(data)}`)
      return data
    }
  }
  const admin = await connect(root.email)
  type Account = { id: string; email: string; perfis: AdminProfile[]; ativo: boolean; atualizadoEm: string }
  const accounts = new Map<string, Account>()
  await t.test('cria contas com perfis explícitos e respostas sem hashes ou sessões', async () => {
    for (const profile of ['EDITOR', 'SECRETARIA', 'CONSULTA'] as const) {
      const result = await admin('/contas', 'POST', { email: `profiles-${profile.toLowerCase()}@example.test`, password, perfis: [profile] }, 201)
      accountIds.push(result.id); accounts.set(profile, result)
      assert.equal(result.senhaHash, undefined)
    }
    const list = await admin('/contas')
    assert.equal(list.items.length, 4)
    assert.ok(!JSON.stringify(list).includes('senhaHash'))
    assert.ok(!JSON.stringify(list).includes('sessoes'))
    for (const perfis of [[], ['DESCONHECIDO'], ['EDITOR', 'EDITOR']]) {
      await admin('/contas', 'POST', { email: 'profiles-invalid@example.test', password, perfis }, 400)
    }
    await admin('/contas', 'POST', { email: 'profiles-invalid@example.test', password, perfis: ['CONSULTA'], ativo: true }, 400)
  })
  const editor = await connect(accounts.get('EDITOR')!.email)
  const secretary = await connect(accounts.get('SECRETARIA')!.email)
  const reader = await connect(accounts.get('CONSULTA')!.email)
  await t.test('editor publica conteúdo; secretaria altera instituição; consulta lê sem escrever', async () => {
    const news = await editor('/noticias', 'POST', { titulo: 'Perfis: teste', categoria: 'Institucional', lede: 'Resumo', conteudo: 'Texto', img: '/uploads/teste.jpg', status: 'PUBLICADO', publicadoEm: '2026-10-08T12:00:00Z' }, 201)
    newsId = news.id
    assert.equal(news.status, 'PUBLICADO')
    await editor('/cadeiras', 'GET', undefined, 403)
    await editor('/noticias/' + newsId, 'DELETE', undefined, 403)
    const term = await secretary('/gestoes', 'POST', { inicioAno: 1901, fimAno: 1902 }, 201)
    termId = term.id
    await secretary('/noticias', 'GET', undefined, 403)
    await secretary('/gestoes/' + termId, 'DELETE', undefined, 403)
    for (const path of ['/noticias', '/cadeiras', '/gestoes', '/auditoria']) await reader(path)
    await reader('/noticias', 'POST', {}, 403)
    await reader('/contas', 'GET', undefined, 403)
    await reader('/uploads', 'POST', {}, 403)
    await reader('/auditoria', 'DELETE', undefined, 403)
  })
  await t.test('alterações somam perfis, revogam sessões e recusam edição desatualizada', async () => {
    const previous = accounts.get('EDITOR')!
    const changed = await admin('/contas/' + previous.id, 'PUT', { perfis: ['EDITOR', 'SECRETARIA'], ativo: true, atualizadoEm: previous.atualizadoEm })
    accounts.set('EDITOR', changed)
    await editor('/auth/me', 'GET', undefined, 401)
    const combined = await connect(previous.email)
    await combined('/noticias'); await combined('/cadeiras')
    await combined('/contas', 'GET', undefined, 403)
    await admin('/contas/' + previous.id, 'PUT', { perfis: ['CONSULTA'], ativo: true, atualizadoEm: previous.atualizadoEm }, 409)
    const history = await admin('/auditoria?recurso=ADMINISTRADOR&registroId=' + previous.id)
    assert.equal(history.total, 2)
    assert.deepEqual(history.items[0].detalhes.perfisAnteriores, ['EDITOR'])
    assert.deepEqual(history.items[0].detalhes.perfisAtuais, ['EDITOR', 'SECRETARIA'])
    assert.equal(history.items[0].administradorId, root.id)
    assert.ok(history.items[0].criadoEm)
    assert.ok(!JSON.stringify(history).includes(password))
  })
  await t.test('desativação e redefinição de senha encerram o acesso anterior', async () => {
    const previous = accounts.get('SECRETARIA')!
    const disabled = await admin('/contas/' + previous.id, 'PUT', { perfis: previous.perfis, ativo: false, atualizadoEm: previous.atualizadoEm })
    await secretary('/auth/me', 'GET', undefined, 401)
    const newPassword = 'Nova senha exclusiva dos perfis 2026'
    await admin('/contas/' + previous.id, 'PUT', { perfis: previous.perfis, ativo: true, atualizadoEm: disabled.atualizadoEm, password: newPassword })
    const fresh = await connect(previous.email, newPassword)
    await fresh('/cadeiras')
    const audit = await admin('/auditoria?recurso=ADMINISTRADOR&registroId=' + previous.id)
    assert.ok(!JSON.stringify(audit).includes(newPassword))
    assert.ok(!JSON.stringify(audit).includes('scrypt$'))
  })
  await t.test('falha na auditoria reverte contas, perfis e revogação de sessões', async failure => {
    const previous = accounts.get('CONSULTA')!
    await prisma.$executeRaw`CREATE FUNCTION teste_auditoria_perfis() RETURNS TRIGGER LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'Falha interna de auditoria'; END; $$`
    await prisma.$executeRaw`CREATE TRIGGER teste_auditoria_perfis_falha BEFORE INSERT ON "RegistroAuditoria" FOR EACH ROW EXECUTE FUNCTION teste_auditoria_perfis()`
    failure.mock.method(console, 'error', () => {})
    try {
      await admin('/contas', 'POST', { email: 'profiles-rollback@example.test', password, perfis: ['CONSULTA'] }, 500)
      assert.equal(await prisma.administrador.count({ where: { email: 'profiles-rollback@example.test' } }), 0)
      await admin('/contas/' + previous.id, 'PUT', { perfis: ['EDITOR'], ativo: false, atualizadoEm: previous.atualizadoEm }, 500)
      const stored = await prisma.administrador.findUniqueOrThrow({ where: { id: previous.id } })
      assert.deepEqual(stored.perfis, ['CONSULTA'])
      assert.equal(stored.ativo, true)
      await reader('/auth/me')
    } finally {
      await prisma.$executeRaw`DROP TRIGGER teste_auditoria_perfis_falha ON "RegistroAuditoria"`
      await prisma.$executeRaw`DROP FUNCTION teste_auditoria_perfis()`
    }
  })
  await t.test('último administrador é protegido pela API e pela manutenção local', async () => {
    const body = { perfis: ['CONSULTA'], ativo: true, atualizadoEm: root.atualizadoEm.toISOString() }
    await admin('/contas/' + root.id, 'PUT', body, 409)
    await admin('/contas/' + root.id, 'PUT', { ...body, perfis: ['ADMINISTRADOR'], ativo: false }, 409)
    await assert.rejects(editAccount(root.id, body, null), /ao menos um administrador/)
  })
  await t.test('duas remoções de privilégios simultâneas nunca deixam o portal sem administrador', async () => {
    const second = await admin('/contas', 'POST', { email: 'profiles-second@example.test', password, perfis: ['ADMINISTRADOR'] }, 201)
    accountIds.push(second.id)
    const results = await Promise.allSettled([root, second].map(account => editAccount(account.id,
      { perfis: ['CONSULTA'], ativo: true, atualizadoEm: new Date(account.atualizadoEm).toISOString() }, { id: account.id, email: account.email })))
    assert.equal(results.filter(result => result.status === 'fulfilled').length, 1)
    assert.equal(results.filter(result => result.status === 'rejected').length, 1)
    assert.equal(await prisma.administrador.count({ where: { ativo: true, perfis: { has: 'ADMINISTRADOR' } } }), 1)
  })
})
