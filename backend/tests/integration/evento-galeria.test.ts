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

type SavedEvent = { id: string; atualizadoEm: string; foto: string | null; titulo: string }
type PublicPhoto = { src: string; legenda: string }
const body = {
  titulo: 'Evento com galeria automática', tipo: 'Sarau', inicioEm: '2026-09-27T19:00:00-03:00',
  local: 'Sede', status: 'PUBLICADO', foto: '/uploads/evento-galeria-inicial.png',
}

test('foto do evento sincronizada com a galeria em PostgreSQL real', async t => {
  t.after(() => prisma.$disconnect())
  const base = await serve(t, createApp())
  const origin = new URL(envConfig.frontendUrl).origin
  const password = 'Senha exclusiva para galeria 2026'
  const user = await prisma.administrador.create({ data: { email: 'galeria@example.test', senhaHash: await hashPassword(password), perfis: ['ADMINISTRADOR'] } })
  const login = await fetch(base + '/api/admin/auth/login', {
    method: 'POST', headers: { Origin: origin, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: user.email, password }),
  })
  assert.equal(login.status, 200)
  const { csrfToken } = await login.json() as { csrfToken: string }
  const headers = { Cookie: login.headers.get('set-cookie')!.split(';')[0], Origin: origin, 'X-CSRF-Token': csrfToken, 'Content-Type': 'application/json' }
  const request = async (path: string, method: string, data?: unknown, expected = 200) => {
    const res = await fetch(base + '/api/admin' + path, { method, headers, body: data === undefined ? undefined : JSON.stringify(data) })
    assert.equal(res.status, expected, `${method} ${path}: ${await res.clone().text()}`)
    return res
  }
  const create = async (fields: Record<string, unknown> = {}) =>
    await (await request('/agenda', 'POST', { ...body, ...fields }, 201)).json() as SavedEvent
  const update = async (event: SavedEvent, fields: Record<string, unknown> = {}) =>
    await (await request('/agenda/' + event.id, 'PUT', { ...body, atualizadoEm: event.atualizadoEm, ...fields })).json() as SavedEvent
  const gallery = async () => {
    const res = await fetch(base + '/api/eventos/galeria')
    assert.equal(res.status, 200)
    return await res.json() as PublicPhoto[]
  }

  await t.test('publicar inclui a foto; salvar novamente e trocar foto/título mantém uma referência', async () => {
    let event = await create()
    const original = await prisma.galeriaFoto.findFirstOrThrow({ where: { eventoId: event.id } })
    assert.equal(original.automatica, true)
    assert.equal(original.textoAlternativo, event.titulo)
    assert.deepEqual((await gallery()).filter(f => f.src === body.foto), [{ src: body.foto, legenda: body.titulo }])
    event = await update(event)
    assert.equal(await prisma.galeriaFoto.count({ where: { eventoId: event.id } }), 1)
    const manual = await prisma.galeriaFoto.create({ data: { eventoId: event.id, src: '/uploads/evento-galeria-extra.png', legenda: 'Foto extra', credito: 'Fotógrafo', ordem: 4 } })
    event = await update(event, { foto: '/uploads/evento-galeria-nova.png', titulo: "Sarau d'Academia — edição revisada" })
    const photo = await prisma.galeriaFoto.findUniqueOrThrow({ where: { id: original.id } })
    assert.equal(photo.src, event.foto)
    assert.equal(photo.legenda, event.titulo)
    assert.equal(photo.textoAlternativo, event.titulo)
    assert.equal(await prisma.galeriaFoto.count({ where: { eventoId: event.id, automatica: true } }), 1)
    assert.deepEqual(await prisma.galeriaFoto.findUnique({ where: { id: manual.id } }), manual)
    assert.equal((await gallery()).some(f => f.src === body.foto), false)
    event = await update(event, { foto: null })
    assert.equal(event.foto, null)
    assert.deepEqual(await prisma.galeriaFoto.findMany({ where: { eventoId: event.id } }), [manual])
  })

  await t.test('rascunhos, arquivados e eventos sem foto não publicam referências automáticas', async () => {
    const foto = '/uploads/evento-galeria-editorial.png'
    const extra = '/uploads/evento-galeria-editorial-extra.png'
    let event = await create({ status: 'RASCUNHO', foto })
    assert.equal(await prisma.galeriaFoto.count({ where: { eventoId: event.id } }), 0)
    await prisma.galeriaFoto.create({ data: { eventoId: event.id, src: extra, legenda: 'Extra editorial' } })
    assert.equal((await gallery()).some(f => [foto, extra].includes(f.src)), false)
    for (const status of ['PUBLICADO', 'RASCUNHO', 'PUBLICADO', 'ARQUIVADO', 'PUBLICADO']) {
      event = await update(event, { status, foto })
      assert.equal((await gallery()).filter(f => [foto, extra].includes(f.src)).length, status === 'PUBLICADO' ? 2 : 0)
      assert.equal(await prisma.galeriaFoto.count({ where: { eventoId: event.id, automatica: false } }), 1)
    }
    const empty = await create({ foto: null })
    assert.equal(await prisma.galeriaFoto.count({ where: { eventoId: empty.id } }), 0)
    await update(empty, { foto: '/uploads/evento-galeria-adicionada.png' })
    assert.equal(await prisma.galeriaFoto.count({ where: { eventoId: empty.id, automatica: true } }), 1)
  })

  await t.test('evento anterior com foto manual igual não duplica nem sobrescreve metadados', async () => {
    const foto = '/uploads/evento-galeria-legada.png'
    const old = await prisma.evento.create({ data: { ...body, status: 'PUBLICADO', inicioEm: new Date(body.inicioEm), descricao: '', foto } })
    let event = { ...old, atualizadoEm: old.atualizadoEm.toISOString() }
    const manual = await prisma.galeriaFoto.create({ data: { eventoId: event.id, src: foto, legenda: 'Legenda original', textoAlternativo: 'Descrição original', credito: 'Acervo da instituição', ordem: 8 } })
    event = { ...event, ...await update(event, { foto }) }
    assert.deepEqual(await prisma.galeriaFoto.findMany({ where: { eventoId: event.id } }), [manual])
    event = { ...event, ...await update(event, { foto: '/uploads/evento-galeria-legada-nova.png' }) }
    assert.equal(await prisma.galeriaFoto.count({ where: { eventoId: event.id } }), 2)
    await update(event, { foto })
    assert.deepEqual(await prisma.galeriaFoto.findMany({ where: { eventoId: event.id } }), [manual])
  })

  await t.test('excluir a referência não recria em GET; salvar recria e excluir evento remove todas as fotos', async () => {
    let event = await create({ foto: '/uploads/evento-galeria-exclusao.png' })
    const photo = await prisma.galeriaFoto.findFirstOrThrow({ where: { eventoId: event.id } })
    await request('/galeria/' + photo.id, 'DELETE', undefined, 204)
    assert.equal((await gallery()).some(f => f.src === event.foto), false)
    assert.equal(await prisma.galeriaFoto.count({ where: { eventoId: event.id } }), 0)
    assert.equal((await prisma.evento.findUniqueOrThrow({ where: { id: event.id } })).foto, event.foto)
    event = await update(event, { foto: event.foto })
    assert.equal(await prisma.galeriaFoto.count({ where: { eventoId: event.id } }), 1)
    await prisma.galeriaFoto.create({ data: { eventoId: event.id, src: '/uploads/evento-galeria-exclusao-extra.png', legenda: 'Extra a excluir' } })
    await request('/agenda/' + event.id, 'DELETE', undefined, 204)
    assert.equal(await prisma.galeriaFoto.count({ where: { eventoId: event.id } }), 0)
    assert.equal((await gallery()).some(f => f.src === event.foto), false)
  })

  await t.test('edições simultâneas mantêm a foto da versão vencedora sem duplicatas', async () => {
    const event = await create({ foto: '/uploads/evento-galeria-concorrente.png' })
    const responses = await Promise.all([1, 2].map(n => fetch(base + '/api/admin/agenda/' + event.id, {
      method: 'PUT', headers,
      body: JSON.stringify({ ...body, atualizadoEm: event.atualizadoEm, foto: `/uploads/evento-galeria-concorrente-${n}.png`, titulo: `Versão ${n}` }),
    })))
    assert.deepEqual(responses.map(res => res.status).sort(), [200, 409])
    const winner = await responses.find(res => res.status === 200)!.json() as SavedEvent
    const photos = await prisma.galeriaFoto.findMany({ where: { eventoId: event.id } })
    assert.equal(photos.length, 1)
    assert.equal(photos[0].src, winner.foto)
    assert.equal(photos[0].legenda, winner.titulo)
    assert.equal((await prisma.evento.findUniqueOrThrow({ where: { id: event.id } })).foto, winner.foto)
  })

  await t.test('falha ao sincronizar a galeria reverte criação e edição do evento', async failure => {
    const event = await create({ foto: '/uploads/evento-galeria-antes-falha.png' })
    const beforeEvent = await prisma.evento.findUniqueOrThrow({ where: { id: event.id } })
    const beforePhotos = await prisma.galeriaFoto.findMany({ where: { eventoId: event.id } })
    // A restrição temporária força a falha só na galeria, após gravar o evento.
    await prisma.$executeRaw`ALTER TABLE "GaleriaFoto" ADD CONSTRAINT "teste_falha_galeria" CHECK ("src" <> '/uploads/evento-galeria-falha.png')`
    failure.mock.method(console, 'error', () => {})
    try {
      const fields = { ...body, titulo: 'Evento que deve ser revertido', foto: '/uploads/evento-galeria-falha.png' }
      await request('/agenda', 'POST', fields, 500)
      assert.equal(await prisma.evento.count({ where: { titulo: fields.titulo } }), 0)
      await request('/agenda/' + event.id, 'PUT', { ...fields, atualizadoEm: event.atualizadoEm }, 500)
      assert.deepEqual(await prisma.evento.findUnique({ where: { id: event.id } }), beforeEvent)
      assert.deepEqual(await prisma.galeriaFoto.findMany({ where: { eventoId: event.id } }), beforePhotos)
    } finally {
      await prisma.$executeRaw`ALTER TABLE "GaleriaFoto" DROP CONSTRAINT "teste_falha_galeria"`
    }
  })

  await t.test('banco impede duas fotos automáticas por evento e referência automática sem evento', async () => {
    const event = await create({ foto: '/uploads/evento-galeria-restricoes.png' })
    const photo = { src: '/uploads/evento-galeria-restricoes-extra.png', legenda: 'Outra foto', automatica: true }
    await assert.rejects(prisma.galeriaFoto.create({ data: { ...photo, eventoId: event.id } }), { code: 'P2002' })
    await assert.rejects(prisma.galeriaFoto.create({ data: photo }))
    await prisma.galeriaFoto.createMany({ data: [1, 2].map(ordem => ({ ...photo, eventoId: event.id, automatica: false, ordem })) })
    assert.equal(await prisma.galeriaFoto.count({ where: { eventoId: event.id, automatica: true } }), 1)
    assert.equal(await prisma.galeriaFoto.count({ where: { eventoId: event.id, automatica: false } }), 2)
  })
})
