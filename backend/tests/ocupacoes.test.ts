import test from 'node:test'
import assert from 'node:assert/strict'
import { ordenarOcupacoes, situacaoCadeira } from '../src/domain/ocupacoes.js'
import { adminItem, type CadeiraAdmin } from '../../frontend/src/services/admin.js'
import { mapCadeira } from '../src/repositories/mappers.js'

const person = (nome: string, inMemoriam = false) => ({ id: nome, nome, inMemoriam, fotoUrl: null, biografia: null, bioExtra: null, criadoEm: new Date(), atualizadoEm: new Date(), obras: [], producoes: [] })
const occupation = (id: string, date: string | null, founder: boolean, inMemoriam: boolean) => ({
  id, cadeiraId: 'c', academicoId: id, fundador: founder, vigente: false,
  inicioEm: date ? new Date(date) : null, inicioAno: date ? Number(date.slice(0, 4)) : null,
  fimEm: null, fimAno: null, periodoTexto: null, academico: person(id, inMemoriam),
})

test('fundador sem ano não substitui o último titular no painel nem no portal', () => {
  const row = { id: 'c', numero: 1, patronoId: 'p', criadoEm: new Date(), atualizadoEm: new Date(), patrono: person('Patrono'),
    ocupacoes: [occupation('ultimo', '2020-01-01', false, true), occupation('fundador', null, true, false)] }
  const publicChair = mapCadeira(row)
  const adminChair = adminItem('cadeiras', JSON.parse(JSON.stringify(row)) as CadeiraAdmin)
  assert.equal(publicChair.status, 'In memoriam')
  assert.equal(adminChair.status, publicChair.status)
  assert.equal(adminChair.title, publicChair.holder)
  assert.deepEqual(publicChair.sucessao?.map(o => o.nome), ['fundador', 'ultimo'])
})

test('trocas no mesmo ano respeitam a data completa e independem da ordem recebida', () => {
  const previous = occupation('z-anterior', '2020-02-01', false, true)
  const last = occupation('a-posterior', '2020-11-01', false, false)
  for (const rows of [[previous, last], [last, previous]]) {
    assert.equal(situacaoCadeira(rows).status, 'Vaga')
    assert.deepEqual(ordenarOcupacoes(rows).map(o => o.id), ['z-anterior', 'a-posterior'])
  }
})

test('datas desconhecidas têm desempate estável e o titular vigente permanece atual', () => {
  const a = occupation('a', null, false, true)
  const b = occupation('b', null, false, false)
  assert.deepEqual(ordenarOcupacoes([b, a]), ordenarOcupacoes([a, b]))
  const current = { ...a, vigente: true, academico: person('Atual') }
  assert.equal(situacaoCadeira([b, current]).membro?.nome, 'Atual')
})
