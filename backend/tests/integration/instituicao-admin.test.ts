import test from 'node:test'
import assert from 'node:assert/strict'
import { serve } from '../serve.js'

const schema = process.env.INTEGRATION_SCHEMA ?? ''
assert.match(schema, /^portal_test_[a-f0-9]{32}$/)
assert.equal(new URL(process.env.DATABASE_URL!).searchParams.get('schema'), schema)
const { prisma } = await import('../../src/db/prisma.js')
const { createApp } = await import('../../src/app.js')
const { hashPassword } = await import('../../src/services/admin-auth.service.js')
const { envConfig } = await import('../../src/config/env.config.js')
const { dataInstitucional } = await import('../../src/repositories/instituicao.repository.js')

test('administração institucional persiste dados, diretoria, versões e auditoria no PostgreSQL', async t => {
  // Esta suíte roda logo após as migrations; limpa somente as próprias fixtures.
  assert.equal(await prisma.instituicao.count(), 0)
  assert.equal(await prisma.gestao.count(), 0)
  const people = await Promise.all(['Ana', 'Bruno', 'Carla', 'Histórico'].map((nome, index) => prisma.academico.create({ data: { nome: 'Diretoria teste ' + nome, inMemoriam: index === 3 } })))
  const password = 'Senha exclusiva da instituicao 2026'
  const user = await prisma.administrador.create({ data: { email: 'institution@example.test', senhaHash: await hashPassword(password) } })
  const boards: string[] = []
  t.after(async () => {
    await prisma.mandatoDiretoria.deleteMany({ where: { gestaoId: { in: boards } } })
    await prisma.gestao.deleteMany({ where: { id: { in: boards } } })
    await prisma.instituicao.deleteMany({ where: { id: 'all' } })
    await prisma.academico.deleteMany({ where: { id: { in: people.map(p => p.id) } } })
    await prisma.administrador.delete({ where: { id: user.id } })
    await prisma.$disconnect()
  })
  const base = await serve(t, createApp())
  const origin = new URL(envConfig.frontendUrl).origin
  const login = await fetch(base + '/api/admin/auth/login', { method: 'POST', headers: { Origin: origin, 'Content-Type': 'application/json' }, body: JSON.stringify({ email: user.email, password }) })
  assert.equal(login.status, 200)
  const { csrfToken } = await login.json() as { csrfToken: string }
  const headers = { Cookie: login.headers.get('set-cookie')!.split(';')[0], Origin: origin, 'X-CSRF-Token': csrfToken, 'Content-Type': 'application/json' }
  const request = async (path: string, method = 'GET', body?: unknown, expected: number | number[] = 200): Promise<any> => {
    const response = await fetch(base + '/api/admin' + path, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) })
    const data: any = response.status === 204 ? null : await response.json()
    assert.ok((Array.isArray(expected) ? expected : [expected]).includes(response.status), `${method} ${path}: ${response.status} ${JSON.stringify(data)}`)
    assert.equal(response.headers.get('cache-control'), 'no-store')
    if (path === '/gestoes' && response.status === 201) boards.push(data.id)
    return data
  }
  const publicInfo = async (): Promise<any> => (await fetch(base + '/api/instituicao')).json()
  const logs = (recurso: 'INSTITUICAO' | 'GESTAO' | 'MANDATO') => prisma.registroAuditoria.findMany({ where: { administradorId: user.id, recurso }, orderBy: { criadoEm: 'asc' } })
  const institution = { nome: 'Academia teste', historia: 'História institucional para publicar', missao: 'Missão institucional', email: 'CONTATO@EXAMPLE.TEST', fundacaoAno: 1964 }
  let info: any, board: any
  const year = dataInstitucional().getUTCFullYear()

  await t.test('cria e edita a instituição sem expor a versão na resposta pública', async () => {
    assert.deepEqual(await request('/instituicao'), { info: null })
    info = (await request('/instituicao', 'PUT', { ...institution, atualizadoEm: null }, 201)).info
    assert.equal(info.email, 'contato@example.test')
    assert.ok(info.atualizadoEm)
    await request('/instituicao', 'PUT', { ...institution, atualizadoEm: null }, 409)
    const previous = info.atualizadoEm
    info = (await request('/instituicao', 'PUT', { ...institution, endereco: 'Sede da Academia', atualizadoEm: previous })).info
    assert.notEqual(info.atualizadoEm, previous)
    await request('/instituicao', 'PUT', { ...institution, atualizadoEm: previous }, 409)
    const published = (await publicInfo()).info
    assert.equal(published.endereco, 'Sede da Academia')
    assert.equal(published.atualizadoEm, undefined)
    const history = await logs('INSTITUICAO')
    assert.deepEqual(history.map(row => row.acao), ['CRIAR', 'EDITAR'])
    assert.equal(history[1].administradorEmail, user.email)
    assert.ok(history[1].criadoEm instanceof Date)
    assert.ok(JSON.stringify(history[1].detalhes).includes('endereco'))
    assert.equal(JSON.stringify(history).includes(institution.historia), false)
  })

  await t.test('duas edições institucionais concorrentes não se sobrescrevem', async () => {
    const beforeLogs = (await logs('INSTITUICAO')).length
    const attempts = await Promise.all(['Primeira', 'Segunda'].map(nome => request('/instituicao', 'PUT', { ...institution, nome, atualizadoEm: info.atualizadoEm }, [200, 409])))
    assert.equal(attempts.filter(result => result.info).length, 1)
    info = (await request('/instituicao')).info
    assert.ok(['Primeira', 'Segunda'].includes(info.nome))
    assert.equal((await logs('INSTITUICAO')).length, beforeLogs + 1)
  })

  await t.test('cria gestão e integrantes atomicamente e publica somente a diretoria vigente', async () => {
    board = await request('/gestoes', 'POST', { inicioAno: year, fimAno: year,
      mandatos: [{ academicoId: people[0].id, cargo: 'Presidente' }] }, 201)
    await request('/gestoes', 'POST', { inicioAno: year - 2, fimAno: year - 1,
      mandatos: [{ academicoId: people[3].id, cargo: 'Presidente' }] }, 201)
    await request('/gestoes', 'POST', { inicioAno: year + 1, fimAno: year + 2,
      mandatos: [{ academicoId: people[2].id, cargo: 'Presidente' }] }, 201)
    const published = (await publicInfo()).gestao
    assert.deepEqual(published, { inicioAno: year, fimAno: year, diretoria: [{ cargo: 'Presidente', nome: people[0].nome, posse: String(year) }] })
    const detail = await request('/gestoes/' + board.id)
    assert.equal(detail.mandatos[0].academico.id, people[0].id)
    assert.equal(detail.atualizadoEm, board.atualizadoEm)
    const page = await request('/gestoes?page=99&pageSize=2')
    assert.equal(page.page, 2)
    assert.equal(page.total, 3)
    assert.equal(page.items.length, 1)
    assert.equal(page.items[0]._count.mandatos, 1)
    await request('/gestoes?pageSize=51', 'GET', undefined, 400)
  })

  await t.test('recusa períodos sobrepostos, datas inválidas, acadêmicos inexistentes e vínculos indevidos', async () => {
    await request('/gestoes', 'POST', { inicioAno: year, fimAno: year }, 409)
    await request('/gestoes/' + board.id, 'PUT', { inicioAno: year, fimAno: year + 1, atualizadoEm: board.atualizadoEm }, 409)
    await request('/gestoes/' + board.id + '/mandatos', 'POST', { academicoId: people[1].id, cargo: 'PRESIDENTE', atualizadoEm: board.atualizadoEm }, 409)
    await request('/gestoes/' + board.id + '/mandatos', 'POST', { academicoId: 'ausente', cargo: 'Secretário', atualizadoEm: board.atualizadoEm }, 404)
    await request('/gestoes/' + board.id + '/mandatos', 'POST', { academicoId: people[3].id, cargo: 'Secretário', atualizadoEm: board.atualizadoEm }, 400)
    await request('/gestoes/' + board.id + '/mandatos', 'POST', { academicoId: people[1].id, cargo: 'Secretário', inicioEm: `${year - 1}-12-31`, atualizadoEm: board.atualizadoEm }, 400)
    await request('/gestoes/' + boards[1] + '/mandatos/' + board.mandatos[0].id, 'PUT', { academicoId: people[0].id, cargo: 'Presidente', atualizadoEm: (await request('/gestoes/' + boards[1])).atualizadoEm }, 404)
    await request('/gestoes/' + board.id, 'DELETE', { atualizadoEm: board.atualizadoEm }, 409)
    await request('/academicos/' + people[0].id, 'DELETE', undefined, 409)
    assert.equal((await request('/gestoes/' + board.id)).mandatos.length, 1)
    const historical = await request('/gestoes', 'POST', { inicioAno: 1000, fimAno: 1001,
      mandatos: [{ academicoId: people[3].id, cargo: 'Presidente' }] }, 201)
    await request('/gestoes/' + historical.id, 'PUT', { inicioAno: year + 10, fimAno: year + 11, atualizadoEm: historical.atualizadoEm }, 400)
  })

  await t.test('encerra mandato e cadastra sucessor sem remover o integrante anterior', async () => {
    board = await request(`/gestoes/${board.id}/mandatos/${board.mandatos[0].id}`, 'PUT', {
      academicoId: people[0].id, cargo: 'Presidente', inicioEm: `${year}-01-01`, fimEm: `${year}-06-30`, atualizadoEm: board.atualizadoEm,
    })
    board = await request(`/gestoes/${board.id}/mandatos`, 'POST', {
      academicoId: people[1].id, cargo: 'Presidente', inicioEm: `${year}-07-01`, fimEm: `${year}-12-31`, atualizadoEm: board.atualizadoEm,
    }, 201)
    assert.equal(board.mandatos.length, 2)
    const current = dataInstitucional() < new Date(`${year}-07-01T00:00:00Z`) ? people[0] : people[1]
    assert.deepEqual((await publicInfo()).gestao.diretoria, [{ cargo: 'Presidente', nome: current.nome, posse: String(year) }])
    await request('/gestoes/' + board.id, 'PUT', { inicioAno: year - 1, fimAno: year - 1, atualizadoEm: board.atualizadoEm }, 409)
    const detached = await request('/gestoes', 'POST', { inicioAno: 1700, fimAno: 1702,
      mandatos: [{ academicoId: people[0].id, cargo: 'Presidente', inicioEm: '1702-01-01' }] }, 201)
    await request('/gestoes/' + detached.id, 'PUT', { inicioAno: 1700, fimAno: 1701, atualizadoEm: detached.atualizadoEm }, 400)
    const revised = await request('/gestoes/' + detached.id, 'PUT', { inicioAno: 1700, fimAno: 1703, atualizadoEm: detached.atualizadoEm })
    assert.equal(revised.fimAno, 1703)
    assert.notEqual(revised.atualizadoEm, detached.atualizadoEm)
  })

  await t.test('escritas concorrentes usam a versão da gestão e não criam cargos duplicados', async () => {
    const current = board
    const attempts = await Promise.all([people[0], people[1]].map(person => request(`/gestoes/${board.id}/mandatos`, 'POST', {
      academicoId: person.id, cargo: 'Secretário', atualizadoEm: current.atualizadoEm,
    }, [201, 409])))
    assert.equal(attempts.filter(result => result.id).length, 1)
    board = await request('/gestoes/' + board.id)
    assert.equal(board.mandatos.filter((m: any) => m.cargo === 'Secretário').length, 1)
    const terms = await Promise.all([1, 2].map(() => request('/gestoes', 'POST', { inicioAno: 1800, fimAno: 1801 }, [201, 409])))
    assert.equal(terms.filter(result => result.id).length, 1)
  })

  await t.test('exclusão explícita corrige cadastro, mantém pessoas e exige versão atual', async () => {
    const secretary = board.mandatos.find((m: any) => m.cargo === 'Secretário')
    const old = board.atualizadoEm
    board = await request(`/gestoes/${board.id}/mandatos/${secretary.id}`, 'DELETE', { atualizadoEm: old })
    assert.equal(board.mandatos.length, 2)
    assert.ok(await prisma.academico.findUnique({ where: { id: secretary.academicoId } }))
    await request(`/gestoes/${board.id}/mandatos/${board.mandatos[0].id}`, 'DELETE', { atualizadoEm: old }, 409)
    const empty = await request('/gestoes', 'POST', { inicioAno: 1600, fimAno: 1601 }, 201)
    await request('/gestoes/' + empty.id, 'DELETE', { atualizadoEm: empty.atualizadoEm }, 204)
    await request('/gestoes/' + empty.id, 'GET', undefined, 404)
    assert.ok((await logs('MANDATO')).some(row => row.acao === 'EXCLUIR' && row.registroId === secretary.id))
    assert.ok((await logs('GESTAO')).some(row => row.acao === 'EXCLUIR' && row.registroId === empty.id))
  })

  await t.test('falha de auditoria reverte instituição, gestão, integrantes e suas versões', async t => {
    t.mock.method(console, 'error', () => {})
    await prisma.$executeRawUnsafe(`CREATE FUNCTION teste_falha_auditoria_institucional() RETURNS TRIGGER LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'falha de teste'; END; $$`)
    await prisma.$executeRawUnsafe(`CREATE TRIGGER teste_falha_auditoria_institucional BEFORE INSERT ON "RegistroAuditoria" FOR EACH ROW EXECUTE FUNCTION teste_falha_auditoria_institucional()`)
    try {
      await request('/instituicao', 'PUT', { ...institution, nome: 'Não gravar', atualizadoEm: info.atualizadoEm }, 500)
      assert.equal((await request('/instituicao')).info.atualizadoEm, info.atualizadoEm)
      assert.equal((await publicInfo()).info.nome, info.nome)
      await request('/gestoes', 'POST', { inicioAno: 1500, fimAno: 1501, mandatos: [{ academicoId: people[0].id, cargo: 'Presidente' }] }, 500)
      assert.equal(await prisma.gestao.count({ where: { inicioAno: 1500 } }), 0)
      await request('/gestoes/' + board.id, 'PUT', { inicioAno: year, fimAno: year, atualizadoEm: board.atualizadoEm }, 500)
      await request(`/gestoes/${board.id}/mandatos`, 'POST', { academicoId: people[2].id, cargo: 'Tesoureiro', atualizadoEm: board.atualizadoEm }, 500)
      const member = board.mandatos[0]
      await request(`/gestoes/${board.id}/mandatos/${member.id}`, 'PUT', {
        academicoId: member.academicoId, cargo: 'Cargo que não deve gravar',
        inicioEm: member.inicioEm?.slice(0, 10), fimEm: member.fimEm?.slice(0, 10), atualizadoEm: board.atualizadoEm,
      }, 500)
      await request(`/gestoes/${board.id}/mandatos/${board.mandatos[0].id}`, 'DELETE', { atualizadoEm: board.atualizadoEm }, 500)
      const empty = await prisma.gestao.findFirstOrThrow({ where: { inicioAno: 1800 } })
      await request('/gestoes/' + empty.id, 'DELETE', { atualizadoEm: empty.atualizadoEm.toISOString() }, 500)
      assert.ok(await prisma.gestao.findUnique({ where: { id: empty.id } }))
      const unchanged = await request('/gestoes/' + board.id)
      assert.deepEqual(unchanged, board)
    } finally {
      await prisma.$executeRawUnsafe('DROP TRIGGER teste_falha_auditoria_institucional ON "RegistroAuditoria"')
      await prisma.$executeRawUnsafe('DROP FUNCTION teste_falha_auditoria_institucional()')
    }
  })

  await t.test('histórico aceita os novos filtros e preserva usuário, data e identificadores', async () => {
    for (const recurso of ['INSTITUICAO', 'GESTAO', 'MANDATO']) {
      const history = await request(`/auditoria?recurso=${recurso}&administradorId=${user.id}&pageSize=50`)
      assert.ok(history.total > 0)
      for (const entry of history.items) {
        assert.equal(entry.recurso, recurso)
        assert.equal(entry.administradorId, user.id)
        assert.equal(entry.administradorEmail, user.email)
        assert.ok(Number.isFinite(Date.parse(entry.criadoEm)))
        if (recurso === 'MANDATO') assert.ok(entry.detalhes.gestaoId && entry.detalhes.academicoId && entry.detalhes.cargo)
      }
    }
  })
})
