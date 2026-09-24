import test from 'node:test'
import assert from 'node:assert/strict'
import { AdminApiError, adminItem, adminPayload, adminRequest, saveAdminForm, uploadAdminFile, type CadeiraAdmin } from '../../frontend/src/services/admin.js'

const chair: CadeiraAdmin = {
  id: 'chair', numero: 12, patrono: { id: 'patron', nome: 'Patrono', biografia: 'Biografia preservada', fotoUrl: '/patrono.jpg' },
  ocupacoes: [{ id: 'occupation', academicoId: 'member', vigente: true, fundador: true, inicioEm: null, inicioAno: 1998,
    academico: { id: 'member', nome: 'Titular anterior', biografia: 'Biografia', bioExtra: 'Informações adicionais', fotoUrl: '/membro.jpg' } }],
}
const newMember = { cadeira: '12', nome: 'Novo titular', patrono: 'Patrono', posse: '2020-01-01', status: 'Titular em exercício' }
const confirmation = { code: 'CONFIRMACAO_CADEIRA', cadeira: chair, ocupacaoAtualId: 'occupation', error: 'Confirme a troca' }

test('formulário preserva instante, arquivo e campos opcionais ao editar', () => {
  const news = { id: 1, titulo: 'Notícia', categoria: 'Cultura', lede: 'Resumo', conteudo: 'Texto', img: '/capa.jpg', status: 'PUBLICADO', publicadoEm: '2020-01-02T01:02:03.456Z' }
  const values = adminItem('noticias', news).values
  assert.equal(values.publicadoEm, '2020-01-01T22:02:03.456')
  const payload = adminPayload('noticias', { ...values, titulo: 'Título corrigido' }, true)
  assert.equal(Date.parse(String(payload.publicadoEm)), Date.parse(news.publicadoEm))
  assert.equal(payload.img, news.img)
  assert.equal(payload.conteudo, news.conteudo)
  const book = { id: 'book', titulo: 'Livro', categoria: 'Livro', status: 'RASCUNHO', autoriaTexto: 'Autoria', edicao: '2ª edição', ano: 2000, paginas: 123, cor: 'ochre', descricao: 'Descrição', pdfUrl: '/livro.pdf' }
  const { id: _id, ...expected } = book
  assert.deepEqual(adminPayload('acervo', adminItem('acervo', book).values, true), expected)
})

test('edição de cadeira não inventa data de posse e preserva campos ocultos', () => {
  const values = adminItem('cadeiras', chair).values
  assert.equal(values.posse, '')
  assert.equal(values.inicioAno, '1998')
  const payload = adminPayload('cadeiras', values, true)
  assert.equal(payload.ocupacaoAtualId, 'occupation')
  assert.equal(payload.inicioEm, undefined)
  assert.deepEqual(payload.patrono, { nome: 'Patrono', biografia: 'Biografia preservada', fotoUrl: '/patrono.jpg' })
  assert.equal((payload.academico as { bioExtra: string }).bioExtra, 'Informações adicionais')
  const exact = structuredClone(chair)
  exact.ocupacoes[0].inicioEm = '1998-06-17T00:00:00.000Z'
  assert.equal(adminItem('cadeiras', exact).values.posse, '1998-06-17')
})

test('salvamento envia cookie e CSRF e não oculta erro de sessão ou servidor', async t => {
  const calls: { path: string; init: RequestInit }[] = []
  const fetch = t.mock.method(globalThis, 'fetch', async (path: string, init: RequestInit) => {
    calls.push({ path, init })
    return Response.json({ id: 1 }, { status: 201 })
  })
  assert.equal(await saveAdminForm('noticias', { titulo: 'Nova' }, null, 'csrf-test', () => true), true)
  assert.equal(calls[0].path, '/api/admin/noticias')
  assert.equal(calls[0].init.method, 'POST')
  assert.equal(calls[0].init.credentials, 'include')
  assert.equal(new Headers(calls[0].init.headers).get('X-CSRF-Token'), 'csrf-test')
  fetch.mock.mockImplementation(async () => Response.json({}, { status: 401 }))
  await assert.rejects(saveAdminForm('noticias', {}, '1', 'csrf-test', () => true), error => error instanceof AdminApiError && error.status === 401)
  fetch.mock.mockImplementation(async () => Response.json({ error: 'Falha de persistência' }, { status: 500 }))
  await assert.rejects(saveAdminForm('noticias', {}, '1', 'csrf-test', () => true), /Falha de persistência/)
  fetch.mock.mockImplementation(async () => { throw new TypeError('network') })
  await assert.rejects(adminRequest('/noticias'), /atualize a lista antes de repetir/)
})

test('cancelar confirmação de cadeira não reenvia o cadastro', async t => {
  const fetch = t.mock.method(globalThis, 'fetch', async () => Response.json(confirmation, { status: 409 }))
  assert.equal(await saveAdminForm('cadeiras', newMember, null, 'csrf-test', message => {
    assert.match(message, /Titular anterior/)
    return false
  }), false)
  assert.equal(fetch.mock.callCount(), 1)
})

test('troca confirma a ocupação exibida e recusa repetir confirmação desatualizada', async t => {
  let count = 0
  const fetch = t.mock.method(globalThis, 'fetch', async (_path: string, init: RequestInit) => {
    const body = JSON.parse(String(init.body))
    if (++count === 1) {
      assert.equal(body.confirmarSubstituicao, undefined)
      return Response.json(confirmation, { status: 409 })
    }
    assert.equal(body.confirmarSubstituicao, true)
    assert.equal(body.ocupacaoAtualId, 'occupation')
    return Response.json(chair)
  })
  assert.equal(await saveAdminForm('cadeiras', newMember, null, 'csrf-test', () => true), true)
  assert.equal(count, 2)
  fetch.mock.mockImplementation(async () => Response.json(confirmation, { status: 409 }))
  await assert.rejects(saveAdminForm('cadeiras', newMember, null, 'csrf-test', () => true), /alterada por outra pessoa/)
})

test('cancelar encerramento de ocupação não envia alterações parciais', async t => {
  const fetch = t.mock.method(globalThis, 'fetch', async () => { throw new Error('Não deve enviar') })
  const values = { ...adminItem('cadeiras', chair).values, status: 'In memoriam', fimEm: '2020-01-01' }
  assert.equal(await saveAdminForm('cadeiras', values, '12', 'csrf-test', () => false), false)
  assert.equal(fetch.mock.callCount(), 0)
  assert.deepEqual(adminPayload('cadeiras', values, true).encerramento, { fimEm: '2020-01-01', inMemoriam: true })
})

test('upload envia arquivo binário autenticado e recusa tamanho/tipo inválidos', async t => {
  const blob = new Blob(['%PDF-1.4\n%%EOF'], { type: 'application/pdf' })
  t.mock.method(globalThis, 'fetch', async (path: string, init: RequestInit) => {
    assert.equal(path, '/api/admin/uploads')
    assert.equal(init.body, blob)
    assert.equal(init.credentials, 'include')
    assert.equal(new Headers(init.headers).get('Content-Type'), 'application/pdf')
    assert.equal(new Headers(init.headers).get('X-CSRF-Token'), 'csrf-test')
    return Response.json({ url: '/uploads/test.pdf' }, { status: 201 })
  })
  assert.equal((await uploadAdminFile(blob, 'csrf-test')).url, '/uploads/test.pdf')
  assert.throws(() => uploadAdminFile(new Blob(['<svg/>'], { type: 'image/svg+xml' }), 'csrf-test'), /PNG, JPEG/)
  assert.throws(() => uploadAdminFile(new Blob([], { type: 'application/pdf' }), 'csrf-test'), /conteúdo/)
  assert.throws(() => uploadAdminFile(new Blob([new Uint8Array(10 * 1024 * 1024 + 1)], { type: 'application/pdf' }), 'csrf-test'), /10 MB/)
})
