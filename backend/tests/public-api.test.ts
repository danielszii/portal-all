import test from 'node:test'
import assert from 'node:assert/strict'
import { createApp } from '../src/app.js'
import { prisma } from '../src/db/prisma.js'
import { mockMethod } from './mock-method.js'
import { serve } from './serve.js'

const lists = [
  ['/api/cadeiras', prisma.cadeira],
  ['/api/eventos', prisma.evento],
  ['/api/eventos/galeria', prisma.galeriaFoto],
  ['/api/noticias', prisma.noticia],
  ['/api/acervo', prisma.acervoItem],
] as const

for (const [path, delegate] of lists) {
  test(`${path}: banco vazio retorna lista vazia`, async t => {
    mockMethod(t, delegate, 'findMany', async () => [])
    const url = await serve(t, createApp())
    const res = await fetch(url + path)
    assert.equal(res.status, 200)
    assert.deepEqual(await res.json(), [])
  })

  test(`${path}: falha de persistência não expõe detalhes nem dados fictícios`, async t => {
    mockMethod(t, delegate, 'findMany', async () => { throw new Error('credencial interna confidencial') })
    t.mock.method(console, 'error', () => {})
    const url = await serve(t, createApp())
    const res = await fetch(url + path)
    assert.equal(res.status, 500)
    assert.deepEqual(await res.json(), {
      status: 'error', statusCode: 500, error: 'Ocorreu um erro interno no servidor.',
    })
  })
}

test('detalhes inexistentes retornam 404 e IDs de notícia inválidos retornam 400', async t => {
  mockMethod(t, prisma.cadeira, 'findUnique', async () => null)
  mockMethod(t, prisma.evento, 'findFirst', async () => null)
  const noticias = mockMethod(t, prisma.noticia, 'findFirst', async () => null)
  const url = await serve(t, createApp())
  for (const path of ['/cadeiras/I', '/cadeiras/IIII', '/eventos/ausente', '/noticias/1']) {
    const res = await fetch(url + '/api' + path)
    assert.equal(res.status, 404, path)
    assert.equal((await res.json() as { statusCode: number }).statusCode, 404)
  }
  for (const id of ['0', '-1', '1abc', '1.5', '9007199254740992']) {
    assert.equal((await fetch(url + '/api/noticias/' + id)).status, 400, id)
  }
  assert.equal(noticias.mock.callCount(), 1)
})

test('instituição sem cadastro não inventa conteúdo nem diretoria', async t => {
  mockMethod(t, prisma.instituicao, 'findUnique', async () => null)
  mockMethod(t, prisma.gestao, 'findFirst', async () => null)
  const url = await serve(t, createApp())
  const res = await fetch(url + '/api/instituicao')
  assert.equal(res.status, 200)
  assert.deepEqual(await res.json(), { info: null, gestao: null })
})

const mensagem = { nome: '  Maria  ', email: 'maria@example.com', mensagem: 'Consulta ao acervo.' }
test('contato HTTP valida antes de salvar, normaliza e mantém leitura privada', async t => {
  const create = mockMethod(t, prisma.contatoMensagem, 'create', async ({ data }) => ({ ...data, dataEnvio: new Date() }))
  const url = await serve(t, createApp())
  const post = (body: unknown) => fetch(url + '/api/contato', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  })
  for (const body of [{}, { ...mensagem, email: 'invalido' }, { ...mensagem, nome: [] }]) {
    assert.equal((await post(body)).status, 400)
  }
  assert.equal(create.mock.callCount(), 0)
  const res = await post(mensagem)
  assert.equal(res.status, 201)
  const result = await res.json() as { sucesso: boolean; id: string }
  assert.equal(result.sucesso, true)
  assert.equal(create.mock.callCount(), 1)
  assert.deepEqual(create.mock.calls[0].arguments[0].data, {
    ...mensagem, id: result.id, nome: 'Maria', assunto: 'Geral',
  })
  assert.equal((await fetch(url + '/api/contato')).status, 404)
})

test('contato HTTP não confirma recebimento quando a gravação falha', async t => {
  mockMethod(t, prisma.contatoMensagem, 'create', async () => { throw new Error('Falha SQL') })
  t.mock.method(console, 'error', () => {})
  const url = await serve(t, createApp())
  const res = await fetch(url + '/api/contato', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(mensagem),
  })
  assert.equal(res.status, 500)
  assert.equal((await res.json() as { sucesso?: boolean }).sucesso, undefined)
})
