import test from 'node:test'
import assert from 'node:assert/strict'
import { ordenarOcupacoes, situacaoCadeira } from '../src/domain/ocupacoes.js'
import { adminItem, type CadeiraAdmin } from '../../frontend/src/services/admin.js'
import { mapCadeira } from '../src/repositories/mappers.js'

const person = (nome: string, inMemoriam = false) => ({ id: nome, nome, inMemoriam, fotoUrl: null, biografia: null, bioExtra: null, criadoEm: new Date(), atualizadoEm: new Date(), obras: [], producoes: [], autorias: [] })
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

test('cadeira In Memoriam reconhece titular legado sem marcação e mantém sua foto', () => {
  const memorial = {
    ...occupation('memorial', null, false, false),
    academico: { ...person('memorial', false), fotoUrl: '/uploads/memorial.webp' },
  }
  const row = {
    id: 'c-memorial', numero: 22, categoria: 'IN_MEMORIAM' as const, patronoId: 'p',
    versao: 'a'.repeat(64), criadoEm: new Date(), atualizadoEm: new Date(), patrono: person('Patrono'),
    ocupacoes: [memorial, occupation('fundador-memorial', null, true, false)],
  }
  const publicChair = mapCadeira(row)
  const adminChair = adminItem('cadeiras', row as CadeiraAdmin)
  assert.equal(publicChair.status, 'In memoriam')
  assert.equal(publicChair.holder, 'memorial')
  assert.equal(publicChair.image, '/uploads/memorial.webp')
  assert.equal(adminChair.status, 'In memoriam')
  assert.equal(adminChair.values.academicoId, 'memorial')
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

test('mapeia membros correspondentes e honorários com categoria e situação próprias', () => {
  for (const [categoria, esperado] of [['CORRESPONDENTE', 'Correspondente'], ['HONORARIO', 'Honorário']] as const) {
    const atual = { ...occupation(`membro-${categoria}`, '2020-01-01', false, false), vigente: true }
    const cadeira = mapCadeira({
      id: `c-${categoria}`,
      numero: 1,
      categoria,
      patronoId: 'p',
      criadoEm: new Date(),
      atualizadoEm: new Date(),
      patrono: person('Patrono'),
      ocupacoes: [atual],
    })
    assert.equal(cadeira.category, esperado)
    assert.equal(cadeira.status, esperado)
    assert.equal(cadeira.sucessao?.[0]?.status, esperado)
  }
})
