import { prisma } from '../db/prisma.js'
import type { Prisma } from '@prisma/client'
import { AppError, ValidationError } from '../errors/app.error.js'
import * as v from './admin-validation.js'
import { checkPersonName, confirmedHomonyms, lockPersonNames, normalizePersonName, PersonConflict, type PersonRole } from './admin-person.service.js'

export const adminCadeiraInclude = {
  patrono: true,
  ocupacoes: { orderBy: [{ inicioAno: 'asc' }, { id: 'asc' }], include: { academico: true } },
} satisfies Prisma.CadeiraInclude

export class CadeiraConflict extends AppError {
  constructor(public readonly cadeira: unknown, public readonly ocupacaoAtualId: string | null) {
    super('O número já existe. Confirme a substituição com a ocupação atual exibida.', 409)
  }
}
function pessoa(input: unknown) {
  const b = v.object(input)
  v.keys(b, ['nome', 'biografia', 'fotoUrl', 'bioExtra'])
  return { nome: v.text(b.nome, 'nome', 200), biografia: v.optionalText(b.biografia, 'biografia'),
    fotoUrl: v.url(b.fotoUrl, 'fotoUrl') || null, bioExtra: v.optionalText(b.bioExtra, 'bioExtra') }
}
function patrono(input: unknown) {
  const b = v.object(input)
  v.keys(b, ['nome', 'biografia', 'fotoUrl'])
  return { nome: v.text(b.nome, 'nome', 200), biografia: v.optionalText(b.biografia, 'biografia'), fotoUrl: v.url(b.fotoUrl, 'fotoUrl') || null }
}
async function lock(tx: Prisma.TransactionClient, numero: number) {
  // Número reservado na transação, inclusive quando a cadeira ainda não existe.
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(230923, ${numero}::int)`
}
function checkDate(inicio: Date, atual?: { inicioEm: Date | null; inicioAno: number | null }) {
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Fortaleza', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date())
  if (inicio.toISOString().slice(0, 10) > today) throw new ValidationError('A troca de titular não pode ter data futura.')
  if (atual && ((atual.inicioEm && inicio < atual.inicioEm) || (atual.inicioAno && inicio.getUTCFullYear() < atual.inicioAno))) throw new ValidationError('A data não pode preceder a posse do titular atual.')
}

export async function createOrReplaceCadeira(input: unknown) {
  const b = v.object(input)
  v.keys(b, ['numero', 'patronoId', 'patrono', 'academicoId', 'academico', 'inicioEm', 'fundadorId', 'fundador', 'confirmarSubstituicao', 'ocupacaoAtualId', 'confirmarHomonimos'])
  const homonyms = confirmedHomonyms(b.confirmarHomonimos)
  const numero = v.integer(b.numero, 'numero', 1, 3999)
  const inicioEm = v.day(b.inicioEm, 'inicioEm')
  const confirmar = v.bool(b.confirmarSubstituicao)
  if ((b.academicoId === undefined) === (b.academico === undefined)) throw new ValidationError('Informe academicoId ou academico, exclusivamente.')
  const novo = b.academico === undefined ? undefined : pessoa(b.academico)
  const academicoId = b.academicoId === undefined ? undefined : v.text(b.academicoId, 'academicoId', 100)
  const novoPatrono = b.patrono === undefined ? undefined : patrono(b.patrono)
  const novoFundador = b.fundador === undefined ? undefined : pessoa(b.fundador)
  if (novoFundador && b.fundadorId !== undefined) throw new ValidationError('Informe fundador ou fundadorId, exclusivamente.')
  const patronoId = b.patronoId === undefined ? undefined : v.text(b.patronoId, 'patronoId', 100)
  if (novoPatrono && patronoId) throw new ValidationError('Informe patrono ou patronoId, exclusivamente.')
  return prisma.$transaction(async tx => {
    await lock(tx, numero)
    let cadeira = await tx.cadeira.findUnique({ where: { numero }, include: adminCadeiraInclude })
    const atual = cadeira?.ocupacoes.find(o => o.vigente)
    if (cadeira && (!confirmar || b.ocupacaoAtualId !== (atual?.id ?? null))) throw new CadeiraConflict(cadeira, atual?.id ?? null)
    // Na repetição confirmada do cadastro, os dados de patrono são preservados.
    // Alterar patrono exige PUT, evitando mudanças acidentais durante a sucessão.
    if (atual && atual.academicoId === academicoId) throw new ValidationError('Este acadêmico já é o titular. Use a edição de dados.')
    checkDate(inicioEm, atual)
    if (!cadeira && novo && novoFundador && normalizePersonName(novo.nome) === normalizePersonName(novoFundador.nome) && !homonyms.includes('fundador')) {
      throw new PersonConflict('fundador', [])
    }
    const people: { role: PersonRole; nome: string }[] = []
    if (novo) people.push({ role: 'academico', nome: novo.nome })
    if (!cadeira && novoPatrono) people.push({ role: 'patrono', nome: novoPatrono.nome })
    if (!cadeira && novoFundador) people.push({ role: 'fundador', nome: novoFundador.nome })
    await lockPersonNames(tx, people)
    for (const person of people) await checkPersonName(tx, person.role, person.nome, homonyms)
    // Uma cadeira vaga também possui história: uma nova posse não pode voltar
    // para antes do encerramento de uma ocupação já registrada.
    for (const previous of cadeira?.ocupacoes ?? []) {
      if (!previous.vigente && ((previous.fimEm && inicioEm < previous.fimEm)
        || (previous.fimAno && inicioEm.getUTCFullYear() < previous.fimAno))) {
        throw new ValidationError('A posse não pode preceder o encerramento de uma ocupação anterior.')
      }
    }
    const membro = academicoId
      ? await tx.academico.findUnique({ where: { id: academicoId } })
      : await tx.academico.create({ data: novo! })
    if (!membro) throw new AppError('Acadêmico não encontrado.', 404)
    if (membro.inMemoriam) throw new ValidationError('Um acadêmico in memoriam não pode assumir a titularidade.')
    if (await tx.ocupacaoCadeira.findFirst({ where: { academicoId: membro.id, vigente: true } })) throw new AppError('Acadêmico já ocupa uma cadeira.', 409)
    const isNew = !cadeira
    if (!cadeira) {
      if (!patronoId && !novoPatrono) throw new ValidationError('Informe o patrono da nova cadeira.')
      const p = patronoId ? await tx.patrono.findUnique({ where: { id: patronoId } }) : await tx.patrono.create({ data: novoPatrono! })
      if (!p) throw new AppError('Patrono não encontrado.', 404)
      cadeira = await tx.cadeira.create({ data: { numero, patronoId: p.id }, include: adminCadeiraInclude })
    }
    if (atual) await tx.ocupacaoCadeira.update({ where: { id: atual.id }, data: { vigente: false, fimEm: inicioEm, fimAno: inicioEm.getUTCFullYear(), periodoTexto: null } })
    const fundadorId = isNew && novoFundador ? (await tx.academico.create({ data: novoFundador })).id
      : isNew && b.fundadorId !== undefined ? v.text(b.fundadorId, 'fundadorId', 100) : undefined
    if (isNew && fundadorId && fundadorId !== membro.id) {
      if (!await tx.academico.findUnique({ where: { id: fundadorId } })) throw new AppError('Fundador não encontrado.', 404)
      await tx.ocupacaoCadeira.create({ data: { cadeiraId: cadeira.id, academicoId: fundadorId, fundador: true, vigente: false } })
    }
    await tx.ocupacaoCadeira.create({ data: { cadeiraId: cadeira.id, academicoId: membro.id,
      vigente: true, fundador: isNew && (!fundadorId || fundadorId === membro.id), inicioEm, inicioAno: inicioEm.getUTCFullYear() } })
    return { created: isNew, cadeira: await tx.cadeira.findUniqueOrThrow({ where: { numero }, include: adminCadeiraInclude }) }
  })
}

export async function editCadeira(numero: number, input: unknown) {
  const b = v.object(input)
  v.keys(b, ['patrono', 'academico', 'ocupacaoAtualId', 'encerramento'])
  if (b.patrono === undefined && b.academico === undefined && b.encerramento === undefined) throw new ValidationError('Informe dados para editar.')
  const p = b.patrono === undefined ? undefined : patrono(b.patrono)
  const a = b.academico === undefined ? undefined : pessoa(b.academico)
  const encerramento = b.encerramento === undefined ? undefined : v.object(b.encerramento)
  if (encerramento) v.keys(encerramento, ['fimEm', 'inMemoriam'])
  const fimEm = encerramento ? v.day(encerramento.fimEm, 'fimEm') : undefined
  const inMemoriam = encerramento ? v.bool(encerramento.inMemoriam) : false
  return prisma.$transaction(async tx => {
    await lock(tx, numero)
    const cadeira = await tx.cadeira.findUnique({ where: { numero }, include: adminCadeiraInclude })
    if (!cadeira) throw new AppError('Cadeira não encontrada.', 404)
    const atual = cadeira.ocupacoes.find(o => o.vigente)
    if ((a || encerramento) && (!atual || b.ocupacaoAtualId !== atual.id)) throw new CadeiraConflict(cadeira, atual?.id ?? null)
    if (fimEm) checkDate(fimEm, atual)
    if (p) await tx.patrono.update({ where: { id: cadeira.patronoId }, data: p })
    if (a) await tx.academico.update({ where: { id: atual!.academicoId }, data: a })
    if (fimEm) {
      await tx.ocupacaoCadeira.update({ where: { id: atual!.id }, data: { vigente: false, fimEm, fimAno: fimEm.getUTCFullYear(), periodoTexto: null } })
      if (inMemoriam) await tx.academico.update({ where: { id: atual!.academicoId }, data: { inMemoriam: true } })
    }
    return tx.cadeira.findUniqueOrThrow({ where: { numero }, include: adminCadeiraInclude })
  })
}

export async function endOcupacao(numero: number, input: unknown) {
  const b = v.object(input)
  v.keys(b, ['ocupacaoAtualId', 'fimEm', 'inMemoriam'])
  const fimEm = v.day(b.fimEm, 'fimEm')
  const inMemoriam = v.bool(b.inMemoriam)
  return prisma.$transaction(async tx => {
    await lock(tx, numero)
    const cadeira = await tx.cadeira.findUnique({ where: { numero }, include: adminCadeiraInclude })
    if (!cadeira) throw new AppError('Cadeira não encontrada.', 404)
    const atual = cadeira.ocupacoes.find(o => o.vigente)
    if (!atual || b.ocupacaoAtualId !== atual.id) throw new CadeiraConflict(cadeira, atual?.id ?? null)
    checkDate(fimEm, atual)
    await tx.ocupacaoCadeira.update({ where: { id: atual.id }, data: { vigente: false, fimEm, fimAno: fimEm.getUTCFullYear(), periodoTexto: null } })
    if (inMemoriam) await tx.academico.update({ where: { id: atual.academicoId }, data: { inMemoriam: true } })
    return tx.cadeira.findUniqueOrThrow({ where: { numero }, include: adminCadeiraInclude })
  })
}
