import { Prisma } from '@prisma/client'
import { prisma } from '../db/prisma.js'
import { AppError, ValidationError } from '../errors/app.error.js'
import { parsePagination } from '../repositories/catalog-query.js'
import { recordAudit, type AuditActor } from './admin-audit.service.js'
import * as v from './admin-validation.js'

const page = (query: Record<string, unknown>) => parsePagination(query, 20) ?? { page: 1, pageSize: 20 }
const version = (value: unknown) => v.date(value, 'atualizadoEm')
const nextVersion = (current: Date) => new Date(Math.max(Date.now(), current.getTime() + 1))

function workInput(input: unknown) {
  const b = v.object(input); v.keys(b, ['academicoId', 'titulo', 'ano', 'tipo', 'atualizadoEm'])
  return { academicoId: v.text(b.academicoId, 'academicoId', 100), titulo: v.text(b.titulo, 'titulo', 500), ano: v.optionalText(b.ano, 'ano', 30), tipo: v.optionalText(b.tipo, 'tipo', 100) }
}
function productionInput(input: unknown) {
  const b = v.object(input); v.keys(b, ['academicoId', 'titulo', 'tipo', 'texto', 'status', 'publicadoEm', 'atualizadoEm'])
  const status = v.status(b.status), publicadoEm = b.publicadoEm == null ? null : v.date(b.publicadoEm, 'publicadoEm')
  if (status === 'PUBLICADO' && !publicadoEm) throw new ValidationError('Informe a data para publicar a produção.')
  return { academicoId: v.text(b.academicoId, 'academicoId', 100), titulo: v.text(b.titulo, 'titulo', 500), tipo: v.text(b.tipo, 'tipo', 100), texto: v.formattedText(b.texto, 'texto', 100000), status, publicadoEm }
}
async function academic(tx: Prisma.TransactionClient, id: string) {
  if (!await tx.academico.findUnique({ where: { id }, select: { id: true } })) throw new AppError('Acadêmico não encontrado.', 404)
}

export async function listWorks(query: Record<string, unknown>) {
  v.keys(query, ['page', 'pageSize', 'academicoId', 'q']); const pagination = page(query)
  const academicoId = query.academicoId === undefined ? undefined : v.text(query.academicoId, 'academicoId', 100)
  const q = query.q === undefined ? '' : v.text(query.q, 'q', 200)
  const where: Prisma.ObraWhereInput = { ...(academicoId && { academicoId }), ...(q && { titulo: { contains: q, mode: 'insensitive' } }) }
  const total = await prisma.obra.count({ where }), totalPages = Math.max(1, Math.ceil(total / pagination.pageSize)), current = Math.min(pagination.page, totalPages)
  const items = await prisma.obra.findMany({ where, skip: (current - 1) * pagination.pageSize, take: pagination.pageSize, orderBy: [{ titulo: 'asc' }, { id: 'asc' }], include: { academico: { select: { id: true, nome: true } } } })
  return { items, total, page: current, pageSize: pagination.pageSize, totalPages }
}
export async function createWork(input: unknown, actor: AuditActor) {
  const data = workInput(input)
  return prisma.$transaction(async tx => { await academic(tx, data.academicoId); const row = await tx.obra.create({ data }); await recordAudit(tx, actor, { acao: 'CRIAR', recurso: 'OBRA', registroId: row.id, resumo: `CRIAR: ${row.titulo}`, detalhes: { academicoId: row.academicoId } }); return row })
}
export async function updateWork(id: string, input: unknown, actor: AuditActor) {
  const b = v.object(input), data = workInput(b), expected = version(b.atualizadoEm)
  return prisma.$transaction(async tx => { await academic(tx, data.academicoId); const before = await tx.obra.findUnique({ where: { id } }); if (!before) throw new AppError('Obra não encontrada.', 404); if (before.atualizadoEm.getTime() !== expected.getTime()) throw new AppError('A obra foi alterada. Recarregue antes de salvar.', 409); const row = await tx.obra.update({ where: { id, atualizadoEm: expected }, data: { ...data, atualizadoEm: nextVersion(expected) } }); await recordAudit(tx, actor, { acao: 'EDITAR', recurso: 'OBRA', registroId: id, resumo: `EDITAR: ${row.titulo}`, detalhes: { academicoId: row.academicoId } }); return row })
}
export async function deleteWork(id: string, actor: AuditActor) { await prisma.$transaction(async tx => { const row = await tx.obra.findUnique({ where: { id } }); if (!row) throw new AppError('Obra não encontrada.', 404); await tx.obra.delete({ where: { id } }); await recordAudit(tx, actor, { acao: 'EXCLUIR', recurso: 'OBRA', registroId: id, resumo: `EXCLUIR: ${row.titulo}`, detalhes: { academicoId: row.academicoId } }) }) }

export async function listProductions(query: Record<string, unknown>) {
  v.keys(query, ['page', 'pageSize', 'academicoId', 'q']); const pagination = page(query)
  const academicoId = query.academicoId === undefined ? undefined : v.text(query.academicoId, 'academicoId', 100), q = query.q === undefined ? '' : v.text(query.q, 'q', 200)
  const where: Prisma.ProducaoLiterariaWhereInput = { ...(academicoId && { academicoId }), ...(q && { titulo: { contains: q, mode: 'insensitive' } }) }
  const total = await prisma.producaoLiteraria.count({ where }), totalPages = Math.max(1, Math.ceil(total / pagination.pageSize)), current = Math.min(pagination.page, totalPages)
  const items = await prisma.producaoLiteraria.findMany({ where, skip: (current - 1) * pagination.pageSize, take: pagination.pageSize, orderBy: [{ criadoEm: 'desc' }, { id: 'asc' }], include: { academico: { select: { id: true, nome: true } } } })
  return { items, total, page: current, pageSize: pagination.pageSize, totalPages }
}
export async function createProduction(input: unknown, actor: AuditActor) { const data = productionInput(input); return prisma.$transaction(async tx => { await academic(tx, data.academicoId); const row = await tx.producaoLiteraria.create({ data }); await recordAudit(tx, actor, { acao: data.status === 'PUBLICADO' ? 'PUBLICAR' : 'CRIAR', recurso: 'PRODUCAO_LITERARIA', registroId: row.id, resumo: `CRIAR: ${row.titulo}`, detalhes: { academicoId: row.academicoId, status: row.status } }); return row }) }
export async function updateProduction(id: string, input: unknown, actor: AuditActor) { const b = v.object(input), data = productionInput(b), expected = version(b.atualizadoEm); return prisma.$transaction(async tx => { await academic(tx, data.academicoId); const before = await tx.producaoLiteraria.findUnique({ where: { id } }); if (!before) throw new AppError('Produção não encontrada.', 404); if (before.atualizadoEm.getTime() !== expected.getTime()) throw new AppError('A produção foi alterada. Recarregue antes de salvar.', 409); const row = await tx.producaoLiteraria.update({ where: { id, atualizadoEm: expected }, data: { ...data, atualizadoEm: nextVersion(expected) } }); const acao = before.status !== row.status && row.status === 'PUBLICADO' ? 'PUBLICAR' : before.status !== row.status && row.status === 'ARQUIVADO' ? 'ARQUIVAR' : 'EDITAR'; await recordAudit(tx, actor, { acao, recurso: 'PRODUCAO_LITERARIA', registroId: id, resumo: `${acao}: ${row.titulo}`, detalhes: { academicoId: row.academicoId, status: row.status } }); return row }) }
export async function deleteProduction(id: string, actor: AuditActor) { await prisma.$transaction(async tx => { const row = await tx.producaoLiteraria.findUnique({ where: { id } }); if (!row) throw new AppError('Produção não encontrada.', 404); await tx.producaoLiteraria.delete({ where: { id } }); await recordAudit(tx, actor, { acao: 'EXCLUIR', recurso: 'PRODUCAO_LITERARIA', registroId: id, resumo: `EXCLUIR: ${row.titulo}`, detalhes: { academicoId: row.academicoId } }) }) }
