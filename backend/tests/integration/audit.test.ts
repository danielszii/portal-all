import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, readdir, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { basename, dirname, join, resolve } from 'node:path'
import type { RegistroAuditoria } from '@prisma/client'
import { serve } from '../serve.js'
import { imageFixture } from '../upload-fixtures.js'

const schema = process.env.INTEGRATION_SCHEMA ?? ''
assert.match(schema, /^portal_test_[a-f0-9]{32}$/)
assert.equal(new URL(process.env.DATABASE_URL!).searchParams.get('schema'), schema)
const uploadDir = await mkdtemp(join(tmpdir(), 'portal-audit-upload-'))
process.env.UPLOAD_DIR = uploadDir
const { prisma } = await import('../../src/db/prisma.js')
const { createApp } = await import('../../src/app.js')
const { hashPassword } = await import('../../src/services/admin-auth.service.js')
const { envConfig } = await import('../../src/config/env.config.js')

test('auditoria administrativa persiste autoria, ações e integridade com PostgreSQL real', async t => {
  t.after(async () => {
    await prisma.$disconnect()
    assert.equal(dirname(resolve(uploadDir)), resolve(tmpdir()))
    assert.match(basename(uploadDir), /^portal-audit-upload-/)
    await rm(uploadDir, { recursive: true, force: true })
  })
  const base = await serve(t, createApp())
  const origin = new URL(envConfig.frontendUrl).origin
  const password = 'Senha exclusiva de auditoria 2026'
  const user = await prisma.administrador.create({ data: { email: 'audit@example.test', senhaHash: await hashPassword(password) } })
  const started = Date.now()
  const login = () => fetch(base + '/api/admin/auth/login', { method: 'POST', headers: { Origin: origin, 'Content-Type': 'application/json' }, body: JSON.stringify({ email: user.email, password }) })
  const signedIn = await login()
  assert.equal(signedIn.status, 200)
  const { csrfToken } = await signedIn.json() as { csrfToken: string }
  const cookie = signedIn.headers.get('set-cookie')!.split(';')[0]
  const headers = { Cookie: cookie, Origin: origin, 'X-CSRF-Token': csrfToken, 'Content-Type': 'application/json' }
  const request = async (path: string, method = 'GET', body?: unknown, expected = 200) => {
    const response = await fetch(base + '/api/admin' + path, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) })
    assert.equal(response.status, expected, `${method} ${path}: ${await response.clone().text()}`)
    return response
  }
  const logs = (where: { recurso?: RegistroAuditoria['recurso']; registroId?: string } = {}) => prisma.registroAuditoria.findMany({
    where: { administradorId: user.id, ...where }, orderBy: [{ criadoEm: 'asc' }, { id: 'asc' }],
  })
  const news = { titulo: 'Notícia auditada', categoria: 'Institucional', lede: 'Resumo', conteudo: 'Conteúdo completo que não deve ser copiado ao log' }

  await t.test('login e operações editoriais identificam autor, data, campos e transições; exclusão mantém histórico', async () => {
    assert.equal((await logs())[0].acao, 'LOGIN')
    const created = await (await request('/noticias', 'POST', news, 201)).json() as { id: number; atualizadoEm: string }
    let current = created
    for (const fields of [{ conteudo: 'Outro conteúdo que não deve ser copiado' }, { status: 'PUBLICADO', publicadoEm: '2020-01-01T00:00:00Z' }, { status: 'ARQUIVADO' }]) {
      current = await (await request('/noticias/' + created.id, 'PUT', { ...news, ...fields, atualizadoEm: current.atualizadoEm })).json() as typeof created
    }
    await request('/noticias/' + created.id, 'DELETE', undefined, 204)
    const history = await logs({ recurso: 'NOTICIA', registroId: String(created.id) })
    assert.deepEqual(history.map(row => row.acao), ['CRIAR', 'EDITAR', 'PUBLICAR', 'ARQUIVAR', 'EXCLUIR'])
    for (const row of history) {
      assert.equal(row.administradorId, user.id)
      assert.equal(row.administradorEmail, user.email)
      assert.ok(row.criadoEm.getTime() >= started && row.criadoEm.getTime() <= Date.now())
    }
    assert.ok(JSON.stringify(history[1].detalhes).includes('conteudo'))
    assert.ok(JSON.stringify(history[2].detalhes).includes('PUBLICADO'))
    const serialized = JSON.stringify(await logs())
    for (const secret of [password, user.senhaHash, csrfToken, cookie.split('=')[1], news.conteudo]) assert.equal(serialized.includes(secret), false)
    assert.equal(await prisma.noticia.findUnique({ where: { id: created.id } }), null)
    const count = (await logs()).length
    await request('/noticias/' + created.id, 'DELETE', undefined, 404)
    await request('/noticias', 'POST', { ...news, administradorId: 'autor-forjado' }, 400)
    assert.equal((await logs()).length, count)
  })

  await t.test('somente a edição concorrente vencedora gera registro de alteração', async () => {
    const created = await (await request('/noticias', 'POST', news, 201)).json() as { id: number; atualizadoEm: string }
    const attempts = await Promise.all([1, 2].map(n => fetch(base + '/api/admin/noticias/' + created.id, { method: 'PUT', headers, body: JSON.stringify({ ...news, titulo: `Vencedora ${n}`, atualizadoEm: created.atualizadoEm }) })))
    assert.deepEqual(attempts.map(res => res.status).sort(), [200, 409])
    const winner = await attempts.find(res => res.status === 200)!.json() as { titulo: string }
    const entries = await logs({ recurso: 'NOTICIA', registroId: String(created.id) })
    assert.equal(entries.length, 2)
    assert.equal(entries[1].resumo, 'EDITAR: ' + winner.titulo)
  })

  await t.test('cadeiras registram criação, edição, sucessão e encerramento sem copiar biografias', async () => {
    const data = { numero: 3700, inicioEm: '2020-01-01', patrono: { nome: 'Patrono auditado' }, academico: { nome: 'Primeiro titular auditado' } }
    const created = await (await request('/cadeiras', 'POST', data, 201)).json() as { id: string; ocupacoes: { id: string; vigente: boolean }[] }
    let current = created.ocupacoes.find(row => row.vigente)!.id
    await request('/cadeiras/3700', 'PUT', { ocupacaoAtualId: current, academico: { nome: data.academico.nome, biografia: 'Biografia extensa fora do log' } })
    const successor = { ...data, inicioEm: '2021-01-01', academico: { nome: 'Sucessor auditado' } }
    await request('/cadeiras', 'POST', successor, 409)
    const updated = await (await request('/cadeiras', 'POST', { ...successor, confirmarSubstituicao: true, ocupacaoAtualId: current })).json() as typeof created
    current = updated.ocupacoes.find(row => row.vigente)!.id
    await request('/cadeiras/3700/encerrar', 'POST', { ocupacaoAtualId: current, fimEm: '2022-01-01' })
    const history = await logs({ recurso: 'CADEIRA', registroId: created.id })
    assert.deepEqual(history.map(row => row.acao), ['CRIAR', 'EDITAR', 'TROCAR_TITULAR', 'ENCERRAR_OCUPACAO'])
    assert.match(JSON.stringify(history[1].detalhes), /academico.biografia/)
    assert.doesNotMatch(JSON.stringify(history), /Biografia extensa fora do log/)
  })

  await t.test('acervo, agenda, fotos, pessoas e uploads registram suas operações', async () => {
    const acervo = await (await request('/acervo', 'POST', { titulo: 'Acervo auditado', categoria: 'Livro' }, 201)).json() as { id: string }
    await request('/acervo/' + acervo.id, 'DELETE', undefined, 204)
    const event = await (await request('/agenda', 'POST', { titulo: 'Evento auditado', tipo: 'Sarau', inicioEm: '2026-01-01T00:00:00Z', local: 'Sede', foto: '/uploads/galeria-auditada.png', status: 'PUBLICADO' }, 201)).json() as { id: string }
    const photo = await prisma.galeriaFoto.findFirstOrThrow({ where: { eventoId: event.id } })
    await request('/galeria/' + photo.id, 'DELETE', undefined, 204)
    await request('/agenda/' + event.id, 'DELETE', undefined, 204)
    const academic = await prisma.academico.create({ data: { nome: 'Pessoa excluída auditada' } })
    const patron = await prisma.patrono.create({ data: { nome: 'Patrono excluído auditado' } })
    await request('/academicos/' + academic.id, 'DELETE', undefined, 204)
    await request('/patronos/' + patron.id, 'DELETE', undefined, 204)
    const upload = await fetch(base + '/api/admin/uploads', { method: 'POST', headers: { ...headers, 'Content-Type': 'image/png' }, body: Uint8Array.from(await imageFixture()) })
    assert.equal(upload.status, 201)
    const file = await upload.json() as { url: string; size: number; contentType: string }
    const uploadLog = (await logs({ recurso: 'UPLOAD' }))[0]
    assert.equal(uploadLog.acao, 'ENVIAR_ARQUIVO')
    assert.deepEqual(uploadLog.detalhes, file)
    const history = await logs()
    for (const recurso of ['ACERVO', 'EVENTO', 'GALERIA', 'ACADEMICO', 'PATRONO']) assert.ok(history.some(row => row.recurso === recurso && row.acao === 'EXCLUIR'))
  })

  await t.test('falha na auditoria reverte cadastros, edição, exclusão, sessão e arquivo novo', async failure => {
    const current = await (await request('/noticias', 'POST', news, 201)).json() as { id: number; atualizadoEm: string }
    const publication = await prisma.acervoItem.create({ data: { titulo: 'Publicação protegida pela auditoria', categoria: 'Livro', descricao: '', pdfUrl: '', autorias: { create: { academico: { create: { nome: 'Autor protegido pela auditoria' } } } } } })
    const beforeRow = await prisma.noticia.findUniqueOrThrow({ where: { id: current.id } })
    const beforeLogs = (await logs()).length
    const beforeFiles = (await readdir(uploadDir)).sort()
    await prisma.$executeRaw`CREATE FUNCTION teste_auditoria_indisponivel() RETURNS TRIGGER LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'Falha interna de auditoria'; END; $$`
    await prisma.$executeRaw`CREATE TRIGGER teste_auditoria_falha BEFORE INSERT ON "RegistroAuditoria" FOR EACH ROW EXECUTE FUNCTION teste_auditoria_indisponivel()`
    failure.mock.method(console, 'error', () => {})
    try {
      await request('/noticias', 'POST', { ...news, titulo: 'Não pode persistir sem auditoria' }, 500)
      assert.equal(await prisma.noticia.count({ where: { titulo: 'Não pode persistir sem auditoria' } }), 0)
      await request('/noticias/' + current.id, 'PUT', { ...news, titulo: 'Edição revertida', atualizadoEm: current.atualizadoEm }, 500)
      assert.deepEqual(await prisma.noticia.findUnique({ where: { id: current.id } }), beforeRow)
      await request('/acervo/' + publication.id, 'DELETE', undefined, 500)
      assert.ok(await prisma.acervoItem.findUnique({ where: { id: publication.id } }))
      assert.equal(await prisma.autoriaAcervo.count({ where: { acervoId: publication.id } }), 1)
      const upload = await fetch(base + '/api/admin/uploads', { method: 'POST', headers: { ...headers, 'Content-Type': 'image/png' }, body: Uint8Array.from(await imageFixture()) })
      assert.equal(upload.status, 500)
      assert.deepEqual((await readdir(uploadDir)).sort(), beforeFiles)
      await request('/auth/logout', 'POST', undefined, 500)
      await request('/auth/me')
      assert.equal((await login()).status, 500)
      await request('/auth/me')
      assert.equal((await logs()).length, beforeLogs)
    } finally {
      await prisma.$executeRaw`DROP TRIGGER teste_auditoria_falha ON "RegistroAuditoria"`
      await prisma.$executeRaw`DROP FUNCTION teste_auditoria_indisponivel()`
    }
  })

  await t.test('consulta é privada, filtrada e paginada; não há rotas de escrita no histórico', async () => {
    assert.equal((await fetch(base + '/api/admin/auditoria')).status, 401)
    assert.equal((await fetch(base + '/api/auditoria')).status, 404)
    const path = '/auditoria?administradorId=' + user.id + '&pageSize=2'
    const first = await (await request(path + '&page=1')).json() as { items: RegistroAuditoria[]; total: number }
    const second = await (await request(path + '&page=2')).json() as typeof first
    assert.equal(first.total, (await logs()).length)
    assert.equal(first.items.length, 2)
    assert.equal(first.items.some(row => second.items.some(other => other.id === row.id)), false)
    const filtered = await (await request('/auditoria?administradorId=' + user.id + '&recurso=CADEIRA&acao=TROCAR_TITULAR')).json() as typeof first
    assert.equal(filtered.total, 1)
    assert.equal(filtered.items[0].recurso, 'CADEIRA')
    for (const method of ['POST', 'PUT', 'DELETE']) await request('/auditoria', method, undefined, 404)
    assert.equal((await logs()).length, first.total)
  })

  await t.test('banco bloqueia adulteração do histórico; logout e exclusão do usuário preservam autoria', async () => {
    const row = (await logs())[0]
    await assert.rejects(prisma.registroAuditoria.update({ where: { id: row.id }, data: { resumo: 'Adulterado' } }))
    await assert.rejects(prisma.registroAuditoria.delete({ where: { id: row.id } }))
    await assert.rejects(prisma.$executeRaw`TRUNCATE TABLE "RegistroAuditoria"`)
    assert.deepEqual(await prisma.registroAuditoria.findUnique({ where: { id: row.id } }), row)
    await request('/auth/logout', 'POST', undefined, 204)
    assert.equal((await logs({ recurso: 'SESSAO' })).filter(entry => entry.acao === 'LOGOUT').length, 1)
    const beforeCount = (await logs()).length
    await prisma.administrador.delete({ where: { id: user.id } })
    assert.equal((await logs()).length, beforeCount)
    assert.equal((await logs())[0].administradorEmail, user.email)
  })
})
