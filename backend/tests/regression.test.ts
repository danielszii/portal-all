import test from 'node:test'
import assert from 'node:assert/strict'
import { ContatoService } from '../src/services/contato.service.js'
import { ValidationError } from '../src/errors/app.error.js'
import { mapCadeira, mapEvento, numeroCadeira, romano } from '../src/repositories/mappers.js'
import type { IContatoRepository } from '../src/repositories/contato.repository.js'

const valid = { nome: '  Maria  ', email: 'maria@example.com', assunto: 'Acervo', mensagem: 'Gostaria de consultar uma obra.' }
const repo: IContatoRepository = { create: async value => value }

test('contato só confirma depois da persistência e remove espaços externos', async () => {
  let stored = false
  const service = new ContatoService({ ...repo, create: async value => { assert.equal(value.nome, 'Maria'); stored = true; return value } })
  const result = await service.salvarMensagem(valid)
  assert.equal(stored, true)
  assert.equal(result.sucesso, true)
  assert.match(result.id, /^[0-9a-f-]{36}$/)
})
test('falha de persistência é propagada sem confirmação', async () => {
  const service = new ContatoService({ ...repo, create: async () => { throw new Error('database unavailable') } })
  await assert.rejects(service.salvarMensagem(valid), /database unavailable/)
})
test('contato rejeita tipos inesperados, espaços, e-mail inválido e texto excessivo', async () => {
  const service = new ContatoService(repo)
  for (const bad of [{ nome: [] }, { nome: ' ' }, { email: { x: 1 } }, { email: 'sem-arroba' }, { mensagem: 'a'.repeat(5001) }, { assunto: 42 }]) {
    await assert.rejects(service.salvarMensagem({ ...valid, ...bad }), ValidationError)
  }
})
test('números de cadeira aceitam inteiros e romanos canônicos', () => {
  assert.equal(numeroCadeira(' xii '), 12)
  assert.equal(numeroCadeira('12'), 12)
  for (const invalid of ['', 'IIII', 'VX', '12abc', '0', '4000', '-1']) assert.equal(numeroCadeira(invalid), null)
  for (let i = 1; i <= 40; i++) assert.equal(numeroCadeira(romano(i)), i)
})
test('eventos usam Fortaleza e calculam passado pela data', () => {
  const base = { id: 'e', titulo: 'Sessão', tipo: 'Sessão Solene', local: 'Sede', descricao: '', foto: null, fimEm: null, status: 'PUBLICADO' as const, criadoEm: new Date(), atualizadoEm: new Date() }
  const past = mapEvento({ ...base, inicioEm: new Date('2020-01-02T01:00:00Z') })
  assert.equal(past.data, '2020-01-01')
  assert.equal(past.hora, '22h00')
  assert.equal(past.passado, true)
  assert.equal(mapEvento({ ...base, inicioEm: new Date('2099-01-01T12:00:00Z') }).passado, false)
})
test('cadeira conserva autor das obras e a ordem da sucessão', () => {
  const a = (id: string, nome: string) => ({ id, nome, biografia: null, bioExtra: null, fotoUrl: null, inMemoriam: false, criadoEm: new Date(), atualizadoEm: new Date(), obras: [], producoes: [] })
  const ocupacao = (id: string, inicioAno: number, fundador: boolean, vigente: boolean) => ({ id, cadeiraId: 'c', academicoId: id, inicioAno, fimAno: vigente ? null : 2003, inicioEm: null, fimEm: null, periodoTexto: null, fundador, vigente, academico: a(id, id) })
  const result = mapCadeira({ id: 'c', numero: 1, patronoId: 'p', criadoEm: new Date(), atualizadoEm: new Date(), patrono: { id: 'p', nome: 'Patrono', biografia: null, fotoUrl: null }, ocupacoes: [ocupacao('atual', 2004, false, true), ocupacao('fundador', 1998, true, false)] })
  assert.equal(result.holder, 'atual')
  assert.equal(result.founder, 'fundador')
  assert.deepEqual(result.sucessao?.map(s => s.nome), ['fundador', 'atual'])
})
