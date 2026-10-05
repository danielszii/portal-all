import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { basename, dirname, join, resolve } from 'node:path'
import { serve } from '../serve.js'
import { imageFixture, pdfFixture } from '../upload-fixtures.js'

const schema = process.env.INTEGRATION_SCHEMA ?? ''
assert.match(schema, /^portal_test_[a-f0-9]{32}$/)
assert.equal(new URL(process.env.DATABASE_URL!).searchParams.get('schema'), schema)
const uploadDir = await mkdtemp(join(tmpdir(), 'portal-delete-upload-'))
process.env.UPLOAD_DIR = uploadDir
const { prisma } = await import('../../src/db/prisma.js')
const { createApp } = await import('../../src/app.js')
const { hashPassword } = await import('../../src/services/admin-auth.service.js')
const { envConfig } = await import('../../src/config/env.config.js')

test('exclusões administrativas com PostgreSQL real preservam relações e arquivos compartilhados', async t => {
  t.after(async () => {
    await prisma.$disconnect()
    assert.equal(dirname(resolve(uploadDir)), resolve(tmpdir()))
    assert.ok(basename(uploadDir).startsWith('portal-delete-upload-'))
    await rm(uploadDir, { recursive: true, force: true })
  })
  const base = await serve(t, createApp())
  const origin = new URL(envConfig.frontendUrl).origin
  const password = 'Senha exclusiva para teste de exclusao'
  const user = await prisma.administrador.create({ data: { email: 'delete@example.test', senhaHash: await hashPassword(password) } })
  const login = await fetch(base + '/api/admin/auth/login', {
    method: 'POST', headers: { Origin: origin, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: user.email, password }),
  })
  assert.equal(login.status, 200)
  const cookie = login.headers.get('set-cookie')!.split(';')[0]
  const { csrfToken } = await login.json() as { csrfToken: string }
  const headers = { Cookie: cookie, Origin: origin, 'X-CSRF-Token': csrfToken }
  const remove = async (path: string, status = 204) => {
    const res = await fetch(base + '/api/admin' + path, { method: 'DELETE', headers })
    const text = await res.text()
    assert.equal(res.status, status, `${path}: ${text}`)
    assert.equal(res.headers.get('cache-control'), 'no-store')
    if (status === 204) assert.equal(text, '')
  }
  const get = async (path: string): Promise<any> => {
    const res = await fetch(base + '/api' + path, { headers })
    assert.equal(res.status, 200, path)
    return res.json()
  }
  const upload = async (mime: string, bytes: string | Uint8Array) => {
    const res = await fetch(base + '/api/admin/uploads', { method: 'POST', headers: { ...headers, 'Content-Type': mime }, body: bytes })
    assert.equal(res.status, 201)
    return (await res.json() as { url: string }).url
  }
  const pdfBytes = await pdfFixture()
  const pdf = await upload('application/pdf', pdfBytes)
  const photo = await upload('image/png', Uint8Array.from(await imageFixture()))
  const noticia = (titulo: string) => ({ titulo, categoria: 'Cultura', lede: 'Resumo', conteudo: 'Texto', img: photo, status: 'PUBLICADO' as const, publicadoEm: new Date('2020-01-01') })
  const acervo = (titulo: string) => ({ titulo, categoria: 'Livro', descricao: 'Descrição', pdfUrl: pdf, status: 'PUBLICADO' as const })

  await t.test('notícia excluída desaparece do banco, detalhe, busca e destaques', async () => {
    const row = await prisma.noticia.create({ data: noticia('Notícia exclusiva para excluir') })
    const other = await prisma.noticia.create({ data: noticia('Notícia preservada') })
    await remove('/noticias/' + row.id)
    assert.equal(await prisma.noticia.findUnique({ where: { id: row.id } }), null)
    assert.ok(await prisma.noticia.findUnique({ where: { id: other.id } }))
    assert.equal((await fetch(base + '/api/noticias/' + row.id)).status, 404)
    assert.equal((await get('/noticias?q=' + encodeURIComponent(row.titulo))).length, 0)
    assert.deepEqual((await get('/busca?q=' + encodeURIComponent(row.titulo))).noticias, [])
    assert.equal((await get('/inicio/noticias')).some((n: any) => n.id === row.id), false)
    assert.equal((await fetch(base + photo)).status, 200)
    await remove('/noticias/' + row.id, 404)
  })

  await t.test('acervo exclui somente a publicação e suas autorias, preservando autor, outra obra e PDF', async () => {
    const author = await prisma.academico.create({ data: { nome: 'Autor preservado na exclusão' } })
    const row = await prisma.acervoItem.create({ data: { ...acervo('Publicação exclusiva para excluir'), autorias: { create: { academicoId: author.id } } } })
    const other = await prisma.acervoItem.create({ data: { ...acervo('Publicação preservada'), autorias: { create: { academicoId: author.id } } } })
    const total = (await get('/inicio/acervo')).total
    await remove('/acervo/' + row.id)
    assert.equal(await prisma.acervoItem.findUnique({ where: { id: row.id } }), null)
    assert.equal(await prisma.autoriaAcervo.count({ where: { acervoId: row.id } }), 0)
    assert.equal(await prisma.autoriaAcervo.count({ where: { acervoId: other.id } }), 1)
    assert.ok(await prisma.academico.findUnique({ where: { id: author.id } }))
    assert.equal((await fetch(base + '/api/acervo/' + row.id)).status, 404)
    assert.deepEqual((await get('/busca?q=' + encodeURIComponent(row.titulo))).acervo, [])
    assert.equal((await get('/inicio/acervo')).total, total - 1)
    assert.deepEqual(new Uint8Array(await (await fetch(base + pdf)).arrayBuffer()), pdfBytes)
    await remove('/acervo/' + row.id, 404)
  })

  await t.test('falha ao excluir publicação reverte também a remoção das autorias', async () => {
    const row = await prisma.acervoItem.create({ data: { ...acervo('Publicação bloqueada'), autorias: { create: { academico: { create: { nome: 'Autor da publicação bloqueada' } } } } } })
    // Referência adicional apenas no schema isolado de testes para forçar falha no DELETE final.
    await prisma.$executeRaw`CREATE TABLE "TesteBloqueioExclusaoAcervo" ("acervoId" TEXT REFERENCES "AcervoItem" (id) ON DELETE RESTRICT)`
    try {
      await prisma.$executeRaw`INSERT INTO "TesteBloqueioExclusaoAcervo" ("acervoId") VALUES (${row.id})`
      await remove('/acervo/' + row.id, 409)
      assert.ok(await prisma.acervoItem.findUnique({ where: { id: row.id } }))
      assert.equal(await prisma.autoriaAcervo.count({ where: { acervoId: row.id } }), 1)
    } finally {
      await prisma.$executeRaw`DROP TABLE "TesteBloqueioExclusaoAcervo"`
    }
    await remove('/acervo/' + row.id)
  })

  await t.test('acadêmico e patrono sem vínculos podem ser removidos e deixam de aparecer na seleção', async () => {
    const academic = await prisma.academico.create({ data: { nome: 'Acadêmico sem vínculos para excluir' } })
    const patron = await prisma.patrono.create({ data: { nome: 'Patrono sem vínculos para excluir' } })
    for (const [resource, row] of [['academicos', academic], ['patronos', patron]] as const) {
      const selection = `/admin/${resource}?q=${encodeURIComponent(row.nome)}&semVinculos=true`
      assert.equal((await get(selection)).items[0].id, row.id)
      await remove(`/${resource}/${row.id}`)
      const empty = await get(selection + '&page=3')
      assert.equal(empty.total, 0)
      assert.equal(empty.page, 1)
      assert.equal(empty.totalPages, 1)
      assert.deepEqual(empty.items, [])
      await remove(`/${resource}/${row.id}`, 404)
    }
  })

  await t.test('pessoas com histórico de cadeira permanecem protegidas mesmo sem titularidade vigente', async () => {
    const academic = await prisma.academico.create({ data: { nome: 'Fundador histórico protegido' } })
    const chair = await prisma.cadeira.create({ data: {
      numero: 3500, patrono: { create: { nome: 'Patrono histórico protegido' } },
      ocupacoes: { create: { academicoId: academic.id, fundador: true, vigente: false, inicioAno: 2000, fimAno: 2010 } },
    } })
    await remove('/academicos/' + academic.id, 409)
    await remove('/patronos/' + chair.patronoId, 409)
    assert.equal(await prisma.ocupacaoCadeira.count({ where: { cadeiraId: chair.id } }), 1)
    assert.equal((await get('/cadeiras/3500')).founder, academic.nome)
    for (const [resource, name] of [['academicos', academic.nome], ['patronos', 'Patrono histórico protegido']]) {
      const selection = `/admin/${resource}?q=${encodeURIComponent(name)}`
      assert.equal((await get(selection)).total, 1)
      assert.equal((await get(selection + '&semVinculos=true')).total, 0)
    }
  })

  await t.test('obras, produções, autorias e mandatos também impedem exclusão de acadêmico', async () => {
    const people = await Promise.all(['obra', 'producao', 'autoria', 'mandato'].map(nome => prisma.academico.create({ data: { nome: 'Pessoa protegida por ' + nome } })))
    await prisma.obra.create({ data: { academicoId: people[0].id, titulo: 'Obra preservada' } })
    await prisma.producaoLiteraria.create({ data: { academicoId: people[1].id, titulo: 'Texto preservado', tipo: 'Poema', texto: 'Versos' } })
    await prisma.acervoItem.create({ data: { ...acervo('Autoria protegida'), autorias: { create: { academicoId: people[2].id } } } })
    await prisma.gestao.create({ data: { inicioAno: 2020, fimAno: 2022, mandatos: { create: { academicoId: people[3].id, cargo: 'Presidente' } } } })
    for (const person of people) {
      await remove('/academicos/' + person.id, 409)
      assert.ok(await prisma.academico.findUnique({ where: { id: person.id } }))
    }
    const selection = '/admin/academicos?q=' + encodeURIComponent('Pessoa protegida por')
    assert.equal((await get(selection + '&semVinculos=false')).total, 4)
    assert.equal((await get(selection + '&semVinculos=true')).total, 0)
  })

  await t.test('listas de pessoas têm desempate estável e voltam à última página após exclusão', async () => {
    for (const resource of ['academicos', 'patronos'] as const) {
      const nome = `Paginação de exclusão ${resource}`
      const data = Array.from({ length: 21 }, () => ({ nome }))
      if (resource === 'academicos') await prisma.academico.createMany({ data })
      else await prisma.patrono.createMany({ data })
      const selection = `/admin/${resource}?q=${encodeURIComponent(nome)}&pageSize=20&semVinculos=true`
      const first = await get(selection + '&page=1')
      const last = await get(selection + '&page=2')
      assert.equal(first.total, 21)
      assert.equal(last.items.length, 1)
      const ids: string[] = [...first.items, ...last.items].map(row => row.id)
      assert.equal(new Set(ids).size, 21)
      assert.deepEqual(ids, [...ids].sort())
      await remove(`/${resource}/${last.items[0].id}`)
      const adjusted = await get(selection + '&page=2')
      assert.equal(adjusted.page, 1)
      assert.equal(adjusted.totalPages, 1)
      assert.equal(adjusted.total, 20)
      assert.equal(adjusted.items.length, 20)
      assert.deepEqual(adjusted.items.map((row: any) => row.id), first.items.map((row: any) => row.id))
    }
  })

  await t.test('busca de pessoas trata curingas SQL como texto e rejeita filtros malformados', async () => {
    for (const resource of ['academicos', 'patronos'] as const) {
      const nome = `Busca literal ${resource} %_\\`
      const data = [{ nome }, { nome: `Busca literal ${resource} outro` }]
      if (resource === 'academicos') await prisma.academico.createMany({ data })
      else await prisma.patrono.createMany({ data })
      const result = await get(`/admin/${resource}?q=${encodeURIComponent(nome)}`)
      assert.equal(result.total, 1)
      assert.equal(result.items[0].nome, nome)
      for (const filter of ['semVinculos=1', 'semVinculos=true&semVinculos=false', 'semVinculos[x]=true']) {
        const response = await fetch(`${base}/api/admin/${resource}?${filter}`, { headers })
        assert.equal(response.status, 400, filter)
      }
    }
  })

  await t.test('galeria lista IDs com paginação e remove só a foto escolhida, preservando evento e arquivo', async () => {
    const event = await prisma.evento.create({ data: { titulo: 'Evento da galeria', tipo: 'Sarau', local: 'Sede', inicioEm: new Date('2020-01-01'), descricao: '', status: 'PUBLICADO', foto: photo } })
    const first = await prisma.galeriaFoto.create({ data: { eventoId: event.id, src: photo, legenda: 'Excluir somente esta referência', ordem: 0 } })
    const second = await prisma.galeriaFoto.create({ data: { eventoId: event.id, src: photo, legenda: 'Manter esta referência', ordem: 1 } })
    const path = `/admin/galeria?eventoId=${event.id}&pageSize=1`
    const page1 = await get(path + '&page=1')
    const page2 = await get(path + '&page=2')
    assert.equal(page1.total, 2)
    assert.equal(page1.totalPages, 2)
    assert.equal(page1.items[0].id, first.id)
    assert.equal(page2.items[0].id, second.id)
    await remove('/galeria/' + first.id)
    assert.equal(await prisma.galeriaFoto.findUnique({ where: { id: first.id } }), null)
    assert.ok(await prisma.galeriaFoto.findUnique({ where: { id: second.id } }))
    assert.ok(await prisma.evento.findUnique({ where: { id: event.id } }))
    assert.equal((await get('/eventos/galeria')).some((f: any) => f.legenda === first.legenda), false)
    assert.equal((await fetch(base + photo)).status, 200)
    await remove('/galeria/' + first.id, 404)
    await remove('/agenda/' + event.id)
    assert.equal(await prisma.galeriaFoto.count({ where: { eventoId: event.id } }), 0)
    assert.equal((await fetch(base + photo)).status, 200)
  })

  await t.test('duas exclusões simultâneas não confirmam duas remoções do mesmo registro', async () => {
    const row = await prisma.acervoItem.create({ data: acervo('Acervo de exclusão concorrente') })
    const responses = await Promise.all([1, 2].map(() => fetch(base + '/api/admin/acervo/' + row.id, { method: 'DELETE', headers })))
    assert.deepEqual(responses.map(res => res.status).sort(), [204, 404])
    assert.equal(await prisma.acervoItem.findUnique({ where: { id: row.id } }), null)
  })
})
