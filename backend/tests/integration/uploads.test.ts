import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, readdir, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { basename, dirname, join, resolve } from 'node:path'
import { serve } from '../serve.js'
import { imageFixture, pdfFixture } from '../upload-fixtures.js'

const schema = process.env.INTEGRATION_SCHEMA ?? ''
assert.match(schema, /^portal_test_[a-f0-9]{32}$/)
assert.equal(new URL(process.env.DATABASE_URL!).searchParams.get('schema'), schema)
const uploadDir = await mkdtemp(join(tmpdir(), 'portal-validated-upload-'))
process.env.UPLOAD_DIR = uploadDir
const { prisma } = await import('../../src/db/prisma.js')
const { createApp } = await import('../../src/app.js')
const { hashPassword } = await import('../../src/services/admin-auth.service.js')
const { envConfig } = await import('../../src/config/env.config.js')

test('uploads validados por HTTP e associados aos campos corretos no PostgreSQL', async t => {
  t.after(async () => {
    await prisma.$disconnect()
    assert.equal(dirname(resolve(uploadDir)), resolve(tmpdir()))
    assert.match(basename(uploadDir), /^portal-validated-upload-/)
    await rm(uploadDir, { recursive: true, force: true })
  })
  const base = await serve(t, createApp())
  const origin = new URL(envConfig.frontendUrl).origin
  const password = 'Senha exclusiva para uploads 2026'
  const user = await prisma.administrador.create({ data: { email: 'upload@example.test', senhaHash: await hashPassword(password) } })
  const login = await fetch(base + '/api/admin/auth/login', {
    method: 'POST', headers: { Origin: origin, 'Content-Type': 'application/json' }, body: JSON.stringify({ email: user.email, password }),
  })
  assert.equal(login.status, 200)
  const { csrfToken } = await login.json() as { csrfToken: string }
  const headers = { Cookie: login.headers.get('set-cookie')!.split(';')[0], Origin: origin, 'X-CSRF-Token': csrfToken }
  const upload = (bytes: Uint8Array, mime: string) => fetch(base + '/api/admin/uploads', {
    method: 'POST', headers: { ...headers, 'Content-Type': mime }, body: bytes,
  })
  const request = async (path: string, method: string, body: unknown, status: number) => {
    const res = await fetch(base + '/api/admin' + path, { method, headers: { ...headers, 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    assert.equal(res.status, status, `${path}: ${await res.clone().text()}`)
    return res
  }
  let photo = '', pdf = ''

  await t.test('PNG, JPEG, WebP e PDF completos são gravados e servidos sem alterar os bytes', async () => {
    const files: [string, Uint8Array][] = [
      ['image/png', Uint8Array.from(await imageFixture())],
      ['image/jpeg', Uint8Array.from(await imageFixture('jpeg'))],
      ['image/webp', Uint8Array.from(await imageFixture('webp'))],
      ['application/pdf', await pdfFixture()],
    ]
    for (const [mime, bytes] of files) {
      const response = await upload(bytes, mime)
      assert.equal(response.status, 201, await response.clone().text())
      const data = await response.json() as { url: string; contentType: string; size: number }
      assert.equal(data.contentType, mime)
      assert.equal(data.size, bytes.length)
      const served = await fetch(base + data.url)
      assert.equal(served.status, 200)
      assert.equal(served.headers.get('content-type'), mime)
      assert.equal(served.headers.get('x-content-type-options'), 'nosniff')
      assert.deepEqual(new Uint8Array(await served.arrayBuffer()), bytes)
      if (mime === 'image/png') photo = data.url
      if (mime === 'application/pdf') pdf = data.url
    }
  })

  await t.test('arquivos falsos, MIME errado e excesso de tamanho não deixam arquivos no disco', async () => {
    const before = (await readdir(uploadDir)).sort()
    const invalid: [string, Uint8Array, number][] = [
      ['image/png', Uint8Array.from([137, 80, 78, 71, 13, 10, 26, 10]), 400],
      ['application/pdf', Uint8Array.from(Buffer.from('%PDF-1.4\n%%EOF')), 400],
      ['image/jpeg', Uint8Array.from(await imageFixture('png')), 400],
      ['image/png', new Uint8Array(0), 400],
      ['image/png', new Uint8Array(10 * 1024 * 1024 + 1), 413],
    ]
    for (const [mime, bytes, status] of invalid) assert.equal((await upload(bytes, mime)).status, status)
    assert.deepEqual((await readdir(uploadDir)).sort(), before)
  })

  await t.test('notícia e evento recusam PDF ao criar e editar; foto correta chega ao portal e à galeria', async () => {
    const bodies = {
      noticias: { titulo: 'Notícia com imagem validada', categoria: 'Cultura', lede: 'Resumo', conteudo: 'Texto', status: 'PUBLICADO', publicadoEm: '2020-01-01T12:00:00-03:00' },
      agenda: { titulo: 'Evento com imagem validada', tipo: 'Sarau', inicioEm: '2026-09-28T12:00:00-03:00', local: 'Sede', status: 'PUBLICADO' },
    }
    for (const resource of ['noticias', 'agenda'] as const) {
      const field = resource === 'noticias' ? 'img' : 'foto'
      const data = { ...bodies[resource], [field]: photo }
      await request('/' + resource, 'POST', { ...data, [field]: pdf + '?download=1#imagem' }, 400)
      const created = await (await request('/' + resource, 'POST', data, 201)).json() as { id: string | number; atualizadoEm: string }
      await request(`/${resource}/${created.id}`, 'PUT', { ...data, atualizadoEm: created.atualizadoEm, [field]: pdf }, 400)
      const publicPath = resource === 'noticias' ? '/api/noticias/' : '/api/eventos/'
      const visible = await (await fetch(base + publicPath + created.id)).json() as Record<string, unknown>
      assert.equal(visible[field], photo)
    }
    const gallery = await (await fetch(base + '/api/eventos/galeria')).json() as { src: string; legenda: string }[]
    assert.ok(gallery.some(row => row.src === photo && row.legenda === bodies.agenda.titulo))
  })

  await t.test('acervo recusa imagem como PDF e preserva o PDF válido após edição inválida', async () => {
    const data = { titulo: 'PDF validado no acervo', categoria: 'Livro', pdfUrl: pdf, status: 'PUBLICADO' }
    await request('/acervo', 'POST', { ...data, pdfUrl: photo }, 400)
    const created = await (await request('/acervo', 'POST', data, 201)).json() as { id: string; atualizadoEm: string }
    await request('/acervo/' + created.id, 'PUT', { ...data, atualizadoEm: created.atualizadoEm, pdfUrl: photo }, 400)
    const visible = await (await fetch(base + '/api/acervo/' + created.id)).json() as { pdf: string }
    assert.equal(visible.pdf, pdf)
  })

  await t.test('titular, fundador e patrono recusam PDF como foto; cadastro e edição válidos preservam imagem', async () => {
    const data = { numero: 3650, inicioEm: '2020-01-01', patrono: { nome: 'Patrono do upload' }, academico: { nome: 'Titular do upload', fotoUrl: photo }, fundador: { nome: 'Fundador do upload' } }
    for (const role of ['academico', 'fundador', 'patrono'] as const) {
      await request('/cadeiras', 'POST', { ...data, [role]: { ...data[role], fotoUrl: pdf } }, 400)
      assert.equal(await prisma.cadeira.findUnique({ where: { numero: data.numero } }), null)
    }
    const chair = await (await request('/cadeiras', 'POST', data, 201)).json() as { versao: string; ocupacoes: { id: string; vigente: boolean }[] }
    const ocupacaoAtualId = chair.ocupacoes.find(row => row.vigente)!.id
    await request('/cadeiras/3650', 'PUT', { versao: chair.versao, ocupacaoAtualId, academico: { ...data.academico, fotoUrl: pdf } }, 400)
    await request('/cadeiras/3650', 'PUT', { versao: chair.versao, patrono: { ...data.patrono, fotoUrl: pdf } }, 400)
    const visible = await (await fetch(base + '/api/cadeiras/3650')).json() as { image: string }
    assert.equal(visible.image, photo)
  })
})
