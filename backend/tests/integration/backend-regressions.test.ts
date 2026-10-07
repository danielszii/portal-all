import test from 'node:test'
import assert from 'node:assert/strict'
import { serve } from '../serve.js'
import { adminItem, adminPayload, type CadeiraAdmin } from '../../../frontend/src/services/admin.js'

const schema = process.env.INTEGRATION_SCHEMA ?? ''
assert.match(schema, /^portal_test_[a-f0-9]{32}$/)
assert.equal(new URL(process.env.DATABASE_URL!).searchParams.get('schema'), schema)
const { prisma } = await import('../../src/db/prisma.js')
const { createApp } = await import('../../src/app.js')
const { hashPassword } = await import('../../src/services/admin-auth.service.js')
const { envConfig } = await import('../../src/config/env.config.js')

test('regressões administrativas com PostgreSQL e dois administradores', async t => {
  t.after(() => prisma.$disconnect())
  const base = await serve(t, createApp())
  const origin = new URL(envConfig.frontendUrl).origin
  const password = 'Senha exclusiva das regressões 2026'
  const senhaHash = await hashPassword(password)
  const connect = async (email: string) => {
    await prisma.administrador.create({ data: { email, senhaHash } })
    const login = await fetch(base + '/api/admin/auth/login', {
      method: 'POST', headers: { Origin: origin, 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }),
    })
    assert.equal(login.status, 200)
    const cookie = login.headers.get('set-cookie')!.split(';')[0]
    const { csrfToken } = await login.json() as { csrfToken: string }
    return async (path: string, method = 'GET', body?: unknown, expected: number | number[] = 200) => {
      const res = await fetch(base + '/api/admin' + path, { method,
        headers: { Cookie: cookie, Origin: origin, 'X-CSRF-Token': csrfToken, 'Content-Type': 'application/json' },
        body: body === undefined ? undefined : JSON.stringify(body),
      })
      assert.ok((Array.isArray(expected) ? expected : [expected]).includes(res.status), `${method} ${path}: ${res.status} ${await res.clone().text()}`)
      return res
    }
  }
  const first = await connect('regression-first@example.test')
  const second = await connect('regression-second@example.test')
  const read = async (numero: number, client = first) => await (await client('/cadeiras/' + numero)).json() as CadeiraAdmin
  const create = async (numero: number, patronoId?: string) => await (await first('/cadeiras', 'POST', {
    numero, inicioEm: '2020-01-01', academico: { nome: `Titular regressão ${numero}`, biografia: 'Original' },
    ...(patronoId ? { patronoId } : { patrono: { nome: `Patrono regressão ${numero}` } }),
  }, 201)).json() as CadeiraAdmin
  const payload = (chair: CadeiraAdmin, changes: Record<string, string>) => adminPayload('cadeiras', { ...adminItem('cadeiras', chair).values, ...changes }, true)

  await t.test('obras existentes verdes e vermelhas podem ser editadas sem trocar a cor ou o PDF', async () => {
    for (const cor of ['green', 'red']) {
      const existing = await prisma.acervoItem.create({ data: {
        titulo: `Obra existente ${cor}`, categoria: 'Livro', cor, descricao: '', status: 'PUBLICADO', pdfUrl: 'https://acervo.example.test/livro.pdf',
      } })
      const body = { titulo: 'Título corrigido', categoria: existing.categoria, cor, pdfUrl: existing.pdfUrl, status: existing.status, atualizadoEm: existing.atualizadoEm }
      await first('/acervo/' + existing.id, 'PUT', body)
      const saved = await prisma.acervoItem.findUniqueOrThrow({ where: { id: existing.id } })
      assert.equal(saved.cor, cor)
      assert.equal(saved.pdfUrl, existing.pdfUrl)
      assert.equal(saved.titulo, body.titulo)
    }
  })

  await t.test('formulário antigo não sobrescreve biografia, patrono ou encerra a ocupação', async () => {
    const original = await create(3801)
    const stale = await read(3801, second)
    assert.equal(original.versao, stale.versao)
    await first('/cadeiras/3801', 'PUT', payload(original, { biografia: 'Alteração preservada' }))
    await second('/cadeiras/3801', 'PUT', payload(stale, { nome: 'Nome desatualizado', patrono: 'Patrono desatualizado', status: 'In memoriam', fimEm: '2021-01-01' }), 409)
    const saved = await read(3801)
    assert.equal(saved.patrono.nome, original.patrono.nome)
    assert.equal(saved.ocupacoes[0].academico.biografia, 'Alteração preservada')
    assert.equal(saved.ocupacoes[0].vigente, true)
    assert.equal(saved.ocupacoes[0].academico.inMemoriam, false)
    assert.notEqual(saved.versao, stale.versao)
    assert.equal(await prisma.registroAuditoria.count({ where: { registroId: original.id, acao: 'EDITAR' } }), 1)
    await second('/cadeiras/3801', 'PUT', payload(await read(3801, second), { nome: 'Nome conferido' }))
    assert.equal((await read(3801)).ocupacoes[0].academico.biografia, 'Alteração preservada')
  })

  await t.test('duas gravações simultâneas da mesma cadeira aceitam somente uma versão', async () => {
    const original = await create(3802)
    const responses = await Promise.all([first, second].map((client, i) => client('/cadeiras/3802', 'PUT', payload(original, { biografia: `Edição ${i}` }), [200, 409])))
    assert.deepEqual(responses.map(res => res.status).sort(), [200, 409])
    const winner = await responses.find(res => res.status === 200)!.json() as CadeiraAdmin
    assert.equal((await read(3802)).ocupacoes[0].academico.biografia, winner.ocupacoes[0].academico.biografia)
    assert.equal(await prisma.registroAuditoria.count({ where: { registroId: original.id, acao: 'EDITAR' } }), 1)
  })

  await t.test('alteração de patrono compartilhado invalida a versão de outra cadeira', async () => {
    const one = await create(3803)
    const two = await create(3804, one.patrono.id)
    await first('/cadeiras/3803', 'PUT', payload(one, { patronoBio: 'Patrono atualizado' }))
    await second('/cadeiras/3804', 'PUT', payload(two, { nome: 'Não deve sobrescrever' }), 409)
    const saved = await read(3804)
    assert.equal(saved.patrono.biografia, 'Patrono atualizado')
    assert.equal(saved.ocupacoes[0].academico.nome, two.ocupacoes[0].academico.nome)

    const current = await Promise.all([read(3803), read(3804, second)])
    const responses = await Promise.all([first, second].map((client, i) => client('/cadeiras/' + current[i].numero, 'PUT', payload(current[i], { patronoBio: `Concorrente ${i}` }), [200, 409])))
    assert.deepEqual(responses.map(res => res.status).sort(), [200, 409])
    const winner = await responses.find(res => res.status === 200)!.json() as CadeiraAdmin
    assert.equal((await read(3803)).patrono.biografia, winner.patrono.biografia)
    assert.equal((await read(3804)).patrono.biografia, winner.patrono.biografia)
  })

  await t.test('cadeira vaga exige versão e rejeita patrono desatualizado sem depender de ocupacaoAtualId', async () => {
    const original = await create(3805)
    await first('/cadeiras/3805/encerrar', 'POST', { ocupacaoAtualId: original.ocupacoes[0].id, fimEm: '2021-01-01' })
    const vacant = await read(3805)
    await first('/cadeiras/3805', 'PUT', { patrono: { nome: 'Sem versão' } }, 400)
    await first('/cadeiras/3805', 'PUT', payload(vacant, { patronoBio: 'Correção em cadeira vaga' }))
    await second('/cadeiras/3805', 'PUT', payload(vacant, { patrono: 'Patrono antigo' }), 409)
    const saved = await read(3805)
    assert.equal(saved.patrono.biografia, 'Correção em cadeira vaga')
    assert.equal(saved.ocupacoes.some(o => o.vigente), false)
  })

  await t.test('edição externa da pessoa vinculada também invalida a versão aberta', async () => {
    const original = await create(3806)
    await prisma.academico.update({ where: { id: original.ocupacoes[0].academicoId }, data: { bioExtra: 'Alteração externa' } })
    await first('/cadeiras/3806', 'PUT', payload(original, { nome: 'Formulário antigo' }), 409)
    assert.equal((await read(3806)).ocupacoes[0].academico.bioExtra, 'Alteração externa')
  })
})
