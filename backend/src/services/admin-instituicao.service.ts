import { Prisma, type MandatoDiretoria } from '@prisma/client'
import { prisma } from '../db/prisma.js'
import { AppError, ValidationError } from '../errors/app.error.js'
import { foldSearch, parsePagination } from '../repositories/catalog-query.js'
import { dataInstitucional } from '../repositories/instituicao.repository.js'
import { changedFields, recordAudit, type AuditActor } from './admin-audit.service.js'
import * as v from './admin-validation.js'

const institutionFields = ['nome', 'historia', 'missao', 'endereco', 'email', 'telefone', 'fundacaoAno', 'sedeTexto', 'trajetoriaTexto', 'horarioAtendimento']
const mandateFields = ['academicoId', 'cargo', 'inicioEm', 'fimEm']
const boardInclude = {
  mandatos: { orderBy: [{ cargo: 'asc' }, { inicioEm: 'asc' }, { id: 'asc' }],
    include: { academico: { select: { id: true, nome: true, inMemoriam: true } } } },
} satisfies Prisma.GestaoInclude

export function institutionInput(input: unknown) {
  const b = v.object(input)
  v.keys(b, [...institutionFields, 'atualizadoEm'])
  const email = v.optionalText(b.email, 'email', 254)
  return {
    nome: v.text(b.nome, 'nome'), historia: v.text(b.historia, 'historia', 100000), missao: v.text(b.missao, 'missao', 20000),
    endereco: v.optionalText(b.endereco, 'endereco', 1000), email: email ? v.email(email) : null,
    telefone: v.optionalText(b.telefone, 'telefone', 50),
    fundacaoAno: b.fundacaoAno == null ? null : v.integer(b.fundacaoAno, 'fundacaoAno', 1, dataInstitucional().getUTCFullYear()),
    sedeTexto: v.optionalText(b.sedeTexto, 'sedeTexto'), trajetoriaTexto: v.optionalText(b.trajetoriaTexto, 'trajetoriaTexto'),
    horarioAtendimento: v.optionalText(b.horarioAtendimento, 'horarioAtendimento', 500),
  }
}

export function termInput(input: Record<string, unknown>) {
  const inicioAno = v.integer(input.inicioAno, 'inicioAno', 1, 9999)
  return { inicioAno, fimAno: input.fimAno == null ? null : v.integer(input.fimAno, 'fimAno', inicioAno, 9999) }
}

export function mandateInput(input: unknown) {
  const b = v.object(input)
  v.keys(b, [...mandateFields, 'atualizadoEm'])
  const inicioEm = b.inicioEm == null ? null : v.day(b.inicioEm, 'inicioEm')
  const fimEm = b.fimEm == null ? null : v.day(b.fimEm, 'fimEm')
  if (inicioEm && fimEm && fimEm < inicioEm) throw new ValidationError('fimEm não pode preceder inicioEm.')
  return { academicoId: v.text(b.academicoId, 'academicoId', 100),
    cargo: v.text(b.cargo, 'cargo', 100).replace(/\s+/gu, ' '), inicioEm, fimEm }
}

type Term = ReturnType<typeof termInput>
type Mandate = ReturnType<typeof mandateInput>
function bounds(term: Term, mandate: Pick<Mandate, 'inicioEm' | 'fimEm'>) {
  const first = v.day(`${String(term.inicioAno).padStart(4, '0')}-01-01`, 'inicioAno')
  const last = v.day(`${String(term.fimAno ?? 9999).padStart(4, '0')}-12-31`, 'fimAno')
  const start = mandate.inicioEm ?? first, end = mandate.fimEm ?? last
  if (start < first || end > last || end < start) throw new ValidationError('O período do mandato deve estar dentro dos anos da gestão.')
  return { start, end }
}

export function validateBoard(term: Term, mandates: Mandate[]) {
  const periods = mandates.map(m => ({ ...bounds(term, m), cargo: foldSearch(m.cargo.trim().replace(/\s+/gu, ' ')) }))
    .sort((a, b) => a.start.getTime() - b.start.getTime())
  const occupied = new Map<string, Date>()
  for (const period of periods) {
    const previousEnd = occupied.get(period.cargo)
    if (previousEnd && period.start <= previousEnd) throw new AppError('O cargo já possui um integrante nesse período. Encerre o mandato anterior antes de cadastrar o sucessor.', 409)
    occupied.set(period.cargo, period.end)
  }
}

// Todas as alterações da diretoria compartilham a reserva, inclusive entre gestões.
async function lock(tx: Prisma.TransactionClient, resource: 'instituicao' | 'diretoria') {
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(261005, ${resource === 'instituicao' ? 1 : 2}::int)`
}
function version(input: unknown) { return v.date(input, 'atualizadoEm') }
function checkVersion(current: Date, expected: Date) {
  if (current.getTime() !== expected.getTime()) throw new AppError('Este registro foi alterado. Reabra a consulta antes de salvar novamente.', 409)
}
const nextVersion = (current?: Date) => new Date(Math.max(Date.now(), (current?.getTime() ?? 0) + 1))

export async function getInstitution() {
  return { info: await prisma.instituicao.findUnique({ where: { id: 'all' } }) }
}
export async function saveInstitution(input: unknown, actor: AuditActor) {
  const b = v.object(input), data = institutionInput(b)
  const expected = b.atualizadoEm === null ? null : version(b.atualizadoEm)
  return prisma.$transaction(async tx => {
    await lock(tx, 'instituicao')
    const before = await tx.instituicao.findUnique({ where: { id: 'all' } })
    if (before) {
      if (!expected) throw new AppError('As informações institucionais já existem. Consulte a versão atual antes de editar.', 409)
      checkVersion(before.atualizadoEm, expected)
    } else if (expected) throw new AppError('Informações institucionais não encontradas.', 404)
    const info = before
      ? await tx.instituicao.update({ where: { id: 'all', atualizadoEm: expected! }, data: { ...data, atualizadoEm: nextVersion(before.atualizadoEm) } })
      : await tx.instituicao.create({ data: { id: 'all', ...data, atualizadoEm: nextVersion() } })
    await recordAudit(tx, actor, { acao: before ? 'EDITAR' : 'CRIAR', recurso: 'INSTITUICAO', registroId: info.id,
      resumo: `${before ? 'EDITAR' : 'CRIAR'}: informações institucionais`,
      detalhes: { camposAlterados: changedFields(before ?? {}, info, institutionFields) } })
    return { info, created: !before }
  })
}

async function getBoard(tx: Prisma.TransactionClient, id: string) {
  const row = await tx.gestao.findUnique({ where: { id }, include: boardInclude })
  if (!row) throw new AppError('Gestão não encontrada.', 404)
  return row
}
export const getGestao = (id: string) => getBoard(prisma, id)
export async function listGestoes(query: Record<string, unknown>) {
  v.keys(query, ['page', 'pageSize'])
  const { page, pageSize } = parsePagination(query, 20) ?? { page: 1, pageSize: 20 }
  return prisma.$transaction(async tx => {
    const total = await tx.gestao.count()
    const totalPages = Math.max(1, Math.ceil(total / pageSize)), current = Math.min(page, totalPages)
    const items = await tx.gestao.findMany({ skip: (current - 1) * pageSize, take: pageSize,
      orderBy: [{ inicioAno: 'desc' }, { id: 'asc' }], include: { _count: { select: { mandatos: true } } } })
    return { items, total, page: current, pageSize, totalPages }
  }, { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead })
}
async function checkTerm(tx: Prisma.TransactionClient, data: Term, exceptId?: string) {
  const conflict = await tx.gestao.findFirst({ where: {
    ...(exceptId ? { id: { not: exceptId } } : {}), inicioAno: { lte: data.fimAno ?? 9999 },
    OR: [{ fimAno: null }, { fimAno: { gte: data.inicioAno } }],
  }, select: { id: true } })
  if (conflict) throw new AppError('Os anos informados coincidem com outra gestão. Ajuste o período anterior antes de salvar.', 409)
}
async function checkMembers(tx: Prisma.TransactionClient, term: Term, mandates: Mandate[]) {
  const people = await tx.academico.findMany({ where: { id: { in: [...new Set(mandates.map(m => m.academicoId))] } },
    select: { id: true, inMemoriam: true } })
  for (const mandate of mandates) {
    const person = people.find(p => p.id === mandate.academicoId)
    if (!person) throw new AppError('Acadêmico não encontrado.', 404)
    if (person.inMemoriam && bounds(term, mandate).end >= dataInstitucional()) {
      throw new ValidationError('Acadêmico in memoriam só pode constar em mandato histórico já encerrado.')
    }
  }
}
async function auditMandate(tx: Prisma.TransactionClient, actor: AuditActor, action: 'CRIAR' | 'EDITAR' | 'EXCLUIR', after: MandatoDiretoria, before?: MandatoDiretoria) {
  await recordAudit(tx, actor, { acao: action, recurso: 'MANDATO', registroId: after.id, resumo: `${action}: mandato de ${after.cargo}`,
    detalhes: { gestaoId: after.gestaoId, academicoId: after.academicoId, cargo: after.cargo,
      inicioEm: after.inicioEm?.toISOString().slice(0, 10) ?? null, fimEm: after.fimEm?.toISOString().slice(0, 10) ?? null,
      academicoAnteriorId: before?.academicoId ?? null, camposAlterados: changedFields(before ?? {}, after, mandateFields) } })
}

export async function createGestao(input: unknown, actor: AuditActor) {
  const b = v.object(input)
  v.keys(b, ['inicioAno', 'fimAno', 'mandatos'])
  const data = termInput(b)
  if (b.mandatos !== undefined && (!Array.isArray(b.mandatos) || b.mandatos.length > 100)) throw new ValidationError('mandatos deve ser uma lista de até 100 integrantes.')
  const mandates = ((b.mandatos ?? []) as unknown[]).map(item => {
    const fields = v.object(item)
    v.keys(fields, mandateFields)
    return mandateInput(fields)
  })
  validateBoard(data, mandates)
  return prisma.$transaction(async tx => {
    await lock(tx, 'diretoria')
    await checkTerm(tx, data)
    await checkMembers(tx, data, mandates)
    const saved = await tx.gestao.create({ data: { ...data, mandatos: { create: mandates } }, include: boardInclude })
    await recordAudit(tx, actor, { acao: 'CRIAR', recurso: 'GESTAO', registroId: saved.id, resumo: `CRIAR: gestão ${saved.inicioAno}`,
      detalhes: { inicioAno: saved.inicioAno, fimAno: saved.fimAno, camposAlterados: ['inicioAno', 'fimAno'] } })
    for (const mandate of saved.mandatos) await auditMandate(tx, actor, 'CRIAR', mandate)
    return saved
  })
}

export async function editGestao(id: string, input: unknown, actor: AuditActor) {
  const b = v.object(input)
  v.keys(b, ['inicioAno', 'fimAno', 'atualizadoEm'])
  const data = termInput(b), expected = version(b.atualizadoEm)
  return prisma.$transaction(async tx => {
    await lock(tx, 'diretoria')
    const before = await getBoard(tx, id)
    checkVersion(before.atualizadoEm, expected)
    await checkTerm(tx, data, id)
    validateBoard(data, before.mandatos)
    await checkMembers(tx, data, before.mandatos)
    const saved = await tx.gestao.update({ where: { id, atualizadoEm: expected }, data: { ...data, atualizadoEm: nextVersion(expected) }, include: boardInclude })
    await recordAudit(tx, actor, { acao: 'EDITAR', recurso: 'GESTAO', registroId: id, resumo: `EDITAR: gestão ${saved.inicioAno}`,
      detalhes: { inicioAno: saved.inicioAno, fimAno: saved.fimAno, camposAlterados: changedFields(before, saved, ['inicioAno', 'fimAno']) } })
    return saved
  })
}

export async function deleteGestao(id: string, input: unknown, actor: AuditActor) {
  const b = v.object(input)
  v.keys(b, ['atualizadoEm'])
  const expected = version(b.atualizadoEm)
  return prisma.$transaction(async tx => {
    await lock(tx, 'diretoria')
    const before = await getBoard(tx, id)
    checkVersion(before.atualizadoEm, expected)
    if (before.mandatos.length) throw new AppError('A gestão possui mandatos. Encerre seu período para preservar o histórico.', 409)
    await tx.gestao.delete({ where: { id, atualizadoEm: expected } })
    await recordAudit(tx, actor, { acao: 'EXCLUIR', recurso: 'GESTAO', registroId: id, resumo: `EXCLUIR: gestão vazia ${before.inicioAno}`,
      detalhes: { inicioAno: before.inicioAno, fimAno: before.fimAno } })
  })
}

export async function saveMandato(gestaoId: string, id: string | null, input: unknown, actor: AuditActor) {
  const b = v.object(input), data = mandateInput(b), expected = version(b.atualizadoEm)
  return prisma.$transaction(async tx => {
    await lock(tx, 'diretoria')
    const board = await getBoard(tx, gestaoId)
    checkVersion(board.atualizadoEm, expected)
    const before = id ? board.mandatos.find(m => m.id === id) : undefined
    if (id && !before) throw new AppError('Mandato não encontrado nesta gestão.', 404)
    validateBoard(board, [...board.mandatos.filter(m => m.id !== id), data])
    await checkMembers(tx, board, [data])
    const saved = id
      ? await tx.mandatoDiretoria.update({ where: { id, gestaoId }, data })
      : await tx.mandatoDiretoria.create({ data: { ...data, gestaoId } })
    const result = await tx.gestao.update({ where: { id: gestaoId, atualizadoEm: expected }, data: { atualizadoEm: nextVersion(expected) }, include: boardInclude })
    await auditMandate(tx, actor, id ? 'EDITAR' : 'CRIAR', saved, before)
    return result
  })
}

export async function deleteMandato(gestaoId: string, id: string, input: unknown, actor: AuditActor) {
  const b = v.object(input)
  v.keys(b, ['atualizadoEm'])
  const expected = version(b.atualizadoEm)
  return prisma.$transaction(async tx => {
    await lock(tx, 'diretoria')
    const board = await getBoard(tx, gestaoId)
    checkVersion(board.atualizadoEm, expected)
    const before = board.mandatos.find(m => m.id === id)
    if (!before) throw new AppError('Mandato não encontrado nesta gestão.', 404)
    await tx.mandatoDiretoria.delete({ where: { id, gestaoId } })
    const result = await tx.gestao.update({ where: { id: gestaoId, atualizadoEm: expected }, data: { atualizadoEm: nextVersion(expected) }, include: boardInclude })
    await auditMandate(tx, actor, 'EXCLUIR', before)
    return result
  })
}
