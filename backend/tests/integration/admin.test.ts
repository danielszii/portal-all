import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { serve } from '../serve.js'
import { adminItem, adminRequest, loadAdminPage, loadAdminRecord, saveAdminForm, uploadAdminFile, type CadeiraAdmin, type EditorialRecord } from '../../../frontend/src/services/admin.js'

const schema = process.env.INTEGRATION_SCHEMA ?? ''
assert.match(schema, /^portal_test_[a-f0-9]{32}$/)
assert.equal(new URL(process.env.DATABASE_URL!).searchParams.get('schema'), schema)
const uploadDir = await mkdtemp(join(tmpdir(), 'portal-admin-upload-'))
process.env.UPLOAD_DIR = uploadDir
const { prisma } = await import('../../src/db/prisma.js')
const { createApp } = await import('../../src/app.js')
const { hashPassword } = await import('../../src/services/admin-auth.service.js')
const { envConfig } = await import('../../src/config/env.config.js')

test('administração com sessão e PostgreSQL real', async t => {
  t.after(async () => { await prisma.$disconnect(); await rm(uploadDir, { recursive: true, force: true }) })
  const base = await serve(t, createApp())
  const origin = new URL(envConfig.frontendUrl).origin
  const password = 'Senha exclusiva de teste 2026'
  const user = await prisma.administrador.create({ data: { email: 'admin@example.test', senhaHash: await hashPassword(password) } })
  let cookie = '', csrf = ''
  const request = async (path: string, method = 'GET', body?: unknown, expected = 200) => {
    const res = await fetch(base + '/api/admin' + path, { method, headers: { Cookie: cookie, Origin: origin, 'X-CSRF-Token': csrf, 'Content-Type': 'application/json' }, body: body === undefined ? undefined : JSON.stringify(body) })
    const data: any = res.status === 204 ? null : await res.json()
    assert.equal(res.status, expected, `${method} ${path}: ${JSON.stringify(data)}`)
    return { res, data }
  }
  await t.test('autentica, protege CSRF e não expõe hash', async () => {
    await request('/auth/me', 'GET', undefined, 401)
    await request('/auth/login', 'POST', { email: user.email, password: 'incorreta' }, 401)
    const { res, data } = await request('/auth/login', 'POST', { email: user.email, password })
    cookie = res.headers.get('set-cookie')!.split(';')[0]
    assert.match(res.headers.get('set-cookie')!, /HttpOnly/i)
    assert.match(res.headers.get('set-cookie')!, /SameSite=Strict/i)
    assert.equal(data.user.senhaHash, undefined)
    await request('/noticias', 'POST', {}, 403)
    csrf = data.csrfToken
    assert.equal((await request('/auth/me')).data.user.email, user.email)
  })
  await t.test('notícias: rascunho privado, publicação e edição', async () => {
    const body = { titulo: 'Notícia administrativa', categoria: 'Cultura', lede: 'Resumo', conteudo: 'Texto' }
    const { data: created } = await request('/noticias', 'POST', body, 201)
    assert.equal((await fetch(base + '/api/noticias/' + created.id)).status, 404)
    await request('/noticias/' + created.id, 'PUT', body, 400)
    const { data: published } = await request('/noticias/' + created.id, 'PUT', { ...body, atualizadoEm: created.atualizadoEm, status: 'PUBLICADO', publicadoEm: '2020-01-01T12:00:00-03:00' })
    assert.equal((await fetch(base + '/api/noticias/' + created.id)).status, 200)
    await request('/noticias/' + created.id, 'PUT', { ...body, atualizadoEm: created.atualizadoEm, status: 'ARQUIVADO' }, 409)
    await request('/noticias/' + created.id, 'PUT', { ...body, atualizadoEm: published.atualizadoEm, status: 'ARQUIVADO' })
    assert.equal((await fetch(base + '/api/noticias/' + created.id)).status, 404)
    assert.ok((await request('/noticias')).data.items.some((n: { id: number }) => n.id === created.id))
  })
  await t.test('upload de PDF e publicação de acervo', async () => {
    const headers = { Cookie: cookie, Origin: origin, 'X-CSRF-Token': csrf, 'Content-Type': 'application/pdf' }
    assert.equal((await fetch(base + '/api/admin/uploads', { method: 'POST', headers, body: '<html>Não é PDF</html>' })).status, 400)
    assert.equal((await fetch(base + '/api/admin/uploads', { method: 'POST', headers, body: Buffer.alloc(10 * 1024 * 1024 + 1) })).status, 413)
    const bytes = '%PDF-1.4\n%%EOF'
    const uploaded = await fetch(base + '/api/admin/uploads', { method: 'POST', headers: { Cookie: cookie, Origin: origin, 'X-CSRF-Token': csrf, 'Content-Type': 'application/pdf' }, body: bytes })
    assert.equal(uploaded.status, 201)
    const file = await uploaded.json() as { url: string }
    const publicFile = await fetch(base + file.url)
    assert.equal(await publicFile.text(), bytes)
    assert.match(publicFile.headers.get('content-security-policy')!, /sandbox/)
    assert.equal(publicFile.headers.get('x-frame-options'), 'SAMEORIGIN')
    const book = { titulo: 'Livro administrativo', categoria: 'Livro', pdfUrl: file.url, status: 'PUBLICADO' }
    const { data } = await request('/acervo', 'POST', book, 201)
    assert.equal((await fetch(base + '/api/acervo/' + data.id)).status, 200)
    await request('/acervo/' + data.id, 'PUT', { ...book, atualizadoEm: data.atualizadoEm, status: 'RASCUNHO' })
    assert.equal((await fetch(base + '/api/acervo/' + data.id)).status, 404)
  })
  await t.test('agenda cria, edita e exclui junto das referências da galeria', async () => {
    const body = { titulo: 'Sarau teste', tipo: 'Sarau', inicioEm: '2026-09-01T15:00:00-03:00', local: 'Sede', status: 'PUBLICADO' }
    const { data: event } = await request('/agenda', 'POST', body, 201)
    await request('/agenda/' + event.id, 'PUT', { ...body, atualizadoEm: event.atualizadoEm, titulo: 'Sarau editado' })
    await prisma.galeriaFoto.create({ data: { eventoId: event.id, src: '/foto.png', legenda: 'Foto do evento' } })
    await request('/agenda/' + event.id, 'DELETE', undefined, 204)
    assert.equal(await prisma.galeriaFoto.count({ where: { eventoId: event.id } }), 0)
    assert.equal((await fetch(base + '/api/eventos/' + event.id)).status, 404)
  })
  await t.test('cadeira exige confirmação, preserva fundador/histórico e recusa confirmação antiga', async () => {
    const body = { numero: 3001, patrono: { nome: 'Patrono administrativo' }, academico: { nome: 'Primeiro titular' }, inicioEm: '2020-01-01' }
    const { data: chair } = await request('/cadeiras', 'POST', body, 201)
    const old = chair.ocupacoes[0]
    const replacement = { ...body, academico: { nome: 'Novo titular' }, inicioEm: '2021-01-01' }
    const before = await prisma.academico.count()
    const { data: conflict } = await request('/cadeiras', 'POST', replacement, 409)
    assert.equal(conflict.code, 'CONFIRMACAO_CADEIRA')
    assert.equal(await prisma.academico.count(), before)
    const confirmed = { ...replacement, confirmarSubstituicao: true, ocupacaoAtualId: conflict.ocupacaoAtualId }
    const { data: updated } = await request('/cadeiras', 'POST', confirmed)
    assert.equal(updated.ocupacoes.length, 2)
    const historical = updated.ocupacoes.find((o: { id: string }) => o.id === old.id)
    assert.equal(historical.fundador, true)
    assert.equal(historical.vigente, false)
    assert.equal(historical.fimAno, 2021)
    await request('/cadeiras', 'POST', confirmed, 409)
    const current = updated.ocupacoes.find((o: { vigente: boolean }) => o.vigente)
    await request('/cadeiras/3001', 'PUT', { academico: { nome: 'Titular corrigido' }, ocupacaoAtualId: current.id })
    const publicChair = await (await fetch(base + '/api/cadeiras/3001')).json() as { holder: string; founder: string; sucessao: unknown[] }
    assert.equal(publicChair.holder, 'Titular corrigido')
    assert.equal(publicChair.founder, 'Primeiro titular')
    assert.equal(publicChair.sucessao.length, 2)
    const attempts = await Promise.all([1, 2].map(n => fetch(base + '/api/admin/cadeiras', { method: 'POST', headers: { Cookie: cookie, Origin: origin, 'X-CSRF-Token': csrf, 'Content-Type': 'application/json' }, body: JSON.stringify({ numero: 3001, academico: { nome: `Concorrente ${n}` }, inicioEm: '2022-01-01', confirmarSubstituicao: true, ocupacaoAtualId: current.id }) })))
    assert.deepEqual(attempts.map(r => r.status).sort(), [200, 409])
    assert.equal(await prisma.ocupacaoCadeira.count({ where: { cadeiraId: chair.id, vigente: true } }), 1)
    const now = await prisma.ocupacaoCadeira.findFirstOrThrow({ where: { cadeiraId: chair.id, vigente: true } })
    await request('/cadeiras/3001/encerrar', 'POST', { ocupacaoAtualId: now.id, fimEm: '2023-01-01', inMemoriam: true })
    assert.equal(await prisma.ocupacaoCadeira.count({ where: { cadeiraId: chair.id, vigente: true } }), 0)
  })
  await t.test('cadeiras recusam datas incoerentes e mantêm transações sem registros órfãos', async () => {
    const body = { numero: 3002, patrono: { nome: 'Outro patrono' }, academico: { nome: 'Titular distinto' }, fundador: { nome: 'Fundador histórico' }, inicioEm: '2020-01-01' }
    const { data: chair } = await request('/cadeiras', 'POST', body, 201)
    assert.equal(chair.ocupacoes.find((o: { fundador: boolean }) => o.fundador).academico.nome, 'Fundador histórico')
    const current = chair.ocupacoes.find((o: { vigente: boolean }) => o.vigente)
    const before = await prisma.academico.count()
    await request('/cadeiras', 'POST', { numero: 3002, academico: { nome: 'Inválido' }, inicioEm: '2019-01-01', confirmarSubstituicao: true, ocupacaoAtualId: current.id }, 400)
    await request('/cadeiras', 'POST', { numero: 3003, academico: { nome: 'Sem patrono' }, inicioEm: '2020-01-01' }, 400)
    await request('/cadeiras', 'POST', { numero: 3003, academicoId: current.academicoId, patronoId: chair.patronoId, inicioEm: '2020-01-01' }, 409)
    assert.equal(await prisma.academico.count(), before)
    assert.equal(await prisma.cadeira.findUnique({ where: { numero: 3003 } }), null)
    const replaced = await prisma.ocupacaoCadeira.findUniqueOrThrow({ where: { id: current.id } })
    assert.equal(replaced.vigente, true)
    assert.equal(replaced.fimEm, null)
  })
  await t.test('formulários do frontend gravam conteúdo e preservam arquivos, datas e histórico no PostgreSQL', async forms => {
    const realFetch = globalThis.fetch.bind(globalThis)
    forms.mock.method(globalThis, 'fetch', async (path: string | URL | Request, init?: RequestInit) => {
      if (typeof path !== 'string' || !path.startsWith('/api/admin')) return realFetch(path, init)
      // O navegador acrescenta Origin e cookie. O teste usa a sessão HTTP real.
      const headers = new Headers(init?.headers)
      headers.set('Origin', origin)
      headers.set('Cookie', cookie)
      return realFetch(base + path, { ...init, headers })
    })
    const confirm = () => true
    const pdfBytes = '%PDF-1.4\n%%EOF'
    const pdf = await uploadAdminFile(new Blob([pdfBytes], { type: 'application/pdf' }), csrf)
    const pngBytes = Uint8Array.from(Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScLbtAAAAABJRU5ErkJggg==', 'base64'))
    const image = await uploadAdminFile(new Blob([pngBytes], { type: 'image/png' }), csrf)
    assert.equal(await (await realFetch(base + pdf.url)).text(), pdfBytes)

    await forms.test('notícia só aparece após publicar; editar preserva imagem e horário', async () => {
      const values = { titulo: 'Formulário notícia', categoria: 'Institucional', lede: 'Resumo', conteudo: 'Conteúdo original', publicadoEm: '2020-02-02T23:34:45.123', img: image.url, status: 'RASCUNHO' }
      assert.equal(await saveAdminForm('noticias', values, null, csrf, confirm), true)
      const list = await loadAdminPage('noticias', 1, values.titulo)
      assert.equal(list.total, 1)
      const id = String(list.items[0].id)
      assert.equal((await realFetch(base + '/api/noticias/' + id)).status, 404)
      const editable = adminItem('noticias', await loadAdminRecord('noticias', id)).values
      await saveAdminForm('noticias', { ...editable, status: 'PUBLICADO', conteudo: 'Conteúdo editado' }, id, csrf, confirm)
      const result = await loadAdminRecord('noticias', id) as EditorialRecord
      assert.equal(result.img, image.url)
      assert.equal(result.publicadoEm, '2020-02-03T02:34:45.123Z')
      const visible = await (await realFetch(base + '/api/noticias/' + id)).json() as { conteudo: string; img: string }
      assert.equal(visible.conteudo, 'Conteúdo editado')
      assert.equal(visible.img, image.url)
    })
    await forms.test('acervo e agenda editam o registro real sem perder metadados', async () => {
      const book = { titulo: 'Formulário livro', categoria: 'Livro', autoriaTexto: 'Autoria de integração', edicao: '2ª', ano: '1999', paginas: '100', cor: 'ochre', descricao: 'Descrição', pdfUrl: pdf.url, status: 'PUBLICADO' }
      await saveAdminForm('acervo', book, null, csrf, confirm)
      const books = await loadAdminPage('acervo', 1, 'Autoria de integração')
      assert.equal(books.total, 1)
      const bookId = String(books.items[0].id)
      const editable = adminItem('acervo', await loadAdminRecord('acervo', bookId)).values
      await saveAdminForm('acervo', { ...editable, titulo: 'Livro corrigido' }, bookId, csrf, confirm)
      const saved = await loadAdminRecord('acervo', bookId) as EditorialRecord
      assert.equal(saved.pdfUrl, pdf.url)
      assert.equal(saved.paginas, 100)
      assert.equal(saved.ano, 1999)
      assert.equal(saved.edicao, '2ª')
      assert.equal((await realFetch(base + '/api/acervo/' + bookId)).status, 200)
      const event = { titulo: 'Formulário evento', tipo: 'Sarau', inicioEm: '2020-02-02T21:00', fimEm: '2020-02-02T23:00', local: 'Local exclusivo', descricao: 'Descrição', foto: image.url, status: 'PUBLICADO' }
      await saveAdminForm('agenda', event, null, csrf, confirm)
      const events = await loadAdminPage('agenda', 1, event.local)
      assert.equal(events.total, 1)
      const eventId = String(events.items[0].id)
      await saveAdminForm('agenda', { ...adminItem('agenda', await loadAdminRecord('agenda', eventId)).values, titulo: 'Evento corrigido' }, eventId, csrf, confirm)
      const savedEvent = await loadAdminRecord('agenda', eventId) as EditorialRecord
      assert.equal(savedEvent.fimEm, '2020-02-03T02:00:00.000Z')
      assert.equal(savedEvent.foto, image.url)
      await adminRequest('/agenda/' + eventId, { method: 'DELETE', csrfToken: csrf })
      assert.equal((await realFetch(base + '/api/eventos/' + eventId)).status, 404)
    })
    await forms.test('cadeira confirma o titular real e encerra edição atomicamente', async () => {
      const values = { cadeira: '3010', nome: 'Titular do formulário', patrono: 'Patrono do formulário', posse: '2020-01-01', status: 'Titular em exercício', fotoUrl: image.url }
      await saveAdminForm('cadeiras', values, null, csrf, confirm)
      const replacement = { ...values, nome: 'Sucessor do formulário', posse: '2021-01-01' }
      assert.equal(await saveAdminForm('cadeiras', replacement, null, csrf, () => false), false)
      assert.equal((await loadAdminRecord('cadeiras', '3010') as CadeiraAdmin).ocupacoes.length, 1)
      await saveAdminForm('cadeiras', replacement, null, csrf, message => {
        assert.match(message, /Titular do formulário/)
        return true
      })
      const record = await loadAdminRecord('cadeiras', '3010') as CadeiraAdmin
      assert.equal(record.ocupacoes.length, 2)
      assert.equal(record.ocupacoes.find(o => o.fundador)?.academico.nome, values.nome)
      const editable = adminItem('cadeiras', record).values
      assert.equal(editable.posse, '2021-01-01')
      const invalid = { ...editable, nome: 'Não deve persistir', patrono: 'Também não deve persistir', status: 'In memoriam', fimEm: '2019-01-01' }
      await assert.rejects(saveAdminForm('cadeiras', invalid, '3010', csrf, confirm), /preceder/)
      const unchanged = await loadAdminRecord('cadeiras', '3010') as CadeiraAdmin
      assert.equal(unchanged.patrono.nome, values.patrono)
      assert.equal(unchanged.ocupacoes.find(o => o.vigente)?.academico.nome, replacement.nome)
      await saveAdminForm('cadeiras', { ...editable, status: 'In memoriam', fimEm: '2022-01-01' }, '3010', csrf, confirm)
      const ended = await loadAdminRecord('cadeiras', '3010') as CadeiraAdmin
      assert.equal(ended.ocupacoes.some(o => o.vigente), false)
      assert.equal(adminItem('cadeiras', ended).status, 'In memoriam')
      const publicChair = await (await realFetch(base + '/api/cadeiras/3010')).json() as { image: string; status: string; sucessao: unknown[] }
      assert.equal(publicChair.status, 'In memoriam')
      assert.equal(publicChair.image, image.url)
      assert.equal(publicChair.sucessao.length, 2)
    })
    await forms.test('busca ocorre no banco antes da paginação e inclui rascunhos', async () => {
      await prisma.noticia.createMany({ data: Array.from({ length: 21 }, (_, n) => ({ titulo: `Grupo página ${n}`, categoria: 'Paginação', lede: 'Resumo', conteudo: 'Conteúdo', img: '', status: 'RASCUNHO' as const })) })
      const page1 = await loadAdminPage('noticias', 1, 'Grupo página')
      const page2 = await loadAdminPage('noticias', 2, 'Grupo página')
      assert.equal(page1.total, 21)
      assert.equal(page1.items.length, 20)
      assert.equal(page2.items.length, 1)
      assert.equal(page2.totalPages, 2)
      const exact = await loadAdminPage('noticias', 1, (page2.items[0] as EditorialRecord).titulo)
      assert.equal(exact.items.some(n => n.id === page2.items[0].id), true)
      assert.equal((await loadAdminPage('noticias', 1, '%')).total, 0)
      assert.equal((await loadAdminPage('cadeiras', 1, 'Titular do formulário')).total, 1)
    })
  })
  await t.test('duas edições simultâneas não sobrescrevem conteúdo silenciosamente', async () => {
    const body = { titulo: 'Notícia concorrente', categoria: 'Cultura', lede: 'Resumo', conteudo: 'Original' }
    const { data: created } = await request('/noticias', 'POST', body, 201)
    const attempts = await Promise.all(['primeiro', 'segundo'].map(conteudo => fetch(base + '/api/admin/noticias/' + created.id, {
      method: 'PUT', headers: { Cookie: cookie, Origin: origin, 'X-CSRF-Token': csrf, 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...body, atualizadoEm: created.atualizadoEm, conteudo }),
    })))
    assert.deepEqual(attempts.map(res => res.status).sort(), [200, 409])
    const winner = await attempts.find(res => res.status === 200)!.json() as { conteudo: string }
    assert.equal((await request('/noticias/' + created.id)).data.conteudo, winner.conteudo)
  })
  await t.test('nomes existentes exigem escolha e cadastro concorrente não duplica pessoas', async () => {
    const patrono = await prisma.patrono.create({ data: { nome: 'Patrono de identidade' } })
    const academic = await prisma.academico.create({ data: { nome: 'João da Silva', biografia: 'Biografia existente' } })
    const body = { numero: 3020, patronoId: patrono.id, academico: { nome: ' JOAO  DA SILVA ' }, inicioEm: '2020-01-01' }
    const { data: conflict } = await request('/cadeiras', 'POST', body, 409)
    assert.equal(conflict.code, 'CONFIRMACAO_PESSOA')
    assert.equal(conflict.candidates[0].id, academic.id)
    const { academico: _newPerson, ...reuse } = body
    await request('/cadeiras', 'POST', { ...reuse, academicoId: academic.id }, 201)
    assert.equal((await prisma.academico.findUniqueOrThrow({ where: { id: academic.id } })).biografia, 'Biografia existente')
    await request('/cadeiras', 'POST', { ...reuse, numero: 3021, academicoId: academic.id }, 409)
    const attempts = await Promise.all([3022, 3023].map(numero => fetch(base + '/api/admin/cadeiras', {
      method: 'POST', headers: { Cookie: cookie, Origin: origin, 'X-CSRF-Token': csrf, 'Content-Type': 'application/json' },
      body: JSON.stringify({ numero, patronoId: patrono.id, academico: { nome: 'Pessoa concorrente única' }, inicioEm: '2020-01-01' }),
    })))
    assert.deepEqual(attempts.map(res => res.status).sort(), [201, 409])
    assert.equal(await prisma.academico.count({ where: { nome: 'Pessoa concorrente única' } }), 1)
    await request('/cadeiras', 'POST', { numero: 3025, patronoId: patrono.id, academico: { nome: 'Nova pessoa' }, fundador: { nome: 'NOVA  PESSOA' }, inicioEm: '2020-01-01' }, 409)
    assert.equal(await prisma.academico.count({ where: { nome: 'Nova pessoa' } }), 0)
    await request('/cadeiras', 'POST', { ...body, numero: 3024, confirmarHomonimos: ['academico'] }, 201)
    assert.equal(await prisma.academico.count({ where: { nome: 'JOAO  DA SILVA' } }), 1)
  })
  await t.test('busca retorna resultados compactos, paginados e sem rascunhos', async () => {
    const marker = 'Busca exclusiva de integração'
    await prisma.noticia.createMany({ data: Array.from({ length: 32 }, (_, index) => ({ titulo: `${marker} ${index}`, categoria: 'Cultura', lede: 'Resumo', conteudo: 'Texto completo que não deve ser enviado', img: '', status: index === 31 ? 'RASCUNHO' : 'PUBLICADO', publicadoEm: new Date('2020-01-01') })) })
    const first = await (await fetch(`${base}/api/busca?q=${encodeURIComponent(marker)}&page=1&pageSize=30`)).json() as { noticias: { id: number; titulo: string }[]; totalPages: number }
    const second = await (await fetch(`${base}/api/busca?q=${encodeURIComponent(marker)}&page=2&pageSize=30`)).json() as typeof first
    assert.equal(first.totalPages, 2)
    assert.equal(first.noticias.length, 30)
    assert.equal(second.noticias.length, 1)
    assert.deepEqual(Object.keys(first.noticias[0]).sort(), ['id', 'titulo'])
    assert.equal(new Set([...first.noticias, ...second.noticias].map(n => n.id)).size, 31)
  })
  await t.test('sessões expiradas, revogadas e contas desativadas são recusadas', async () => {
    await prisma.administrador.update({ where: { id: user.id }, data: { ativo: false } })
    await request('/noticias', 'GET', undefined, 401)
    await prisma.administrador.update({ where: { id: user.id }, data: { ativo: true } })
    await prisma.sessaoAdmin.updateMany({ where: { administradorId: user.id }, data: { expiraEm: new Date(0) } })
    await request('/auth/me', 'GET', undefined, 401)
    const { res, data } = await request('/auth/login', 'POST', { email: user.email, password })
    cookie = res.headers.get('set-cookie')!.split(';')[0]
    csrf = data.csrfToken
    await request('/auth/logout', 'POST', undefined, 204)
    await request('/auth/me', 'GET', undefined, 401)
  })
})
