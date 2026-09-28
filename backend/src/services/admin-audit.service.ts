import { AcaoAuditoria, RecursoAuditoria, Prisma } from '@prisma/client'
import { prisma } from '../db/prisma.js'
import { ValidationError } from '../errors/app.error.js'
import { parsePagination } from '../repositories/catalog-query.js'
import * as v from './admin-validation.js'

export type AuditActor = { id: string; email: string }
type AuditEntry = {
  acao: AcaoAuditoria; recurso: RecursoAuditoria; registroId: string | number
  resumo: string; detalhes?: Prisma.InputJsonObject
}

// Apenas chamadas internas constroem os dados; nunca receba req.body como detalhes.
export async function recordAudit(tx: Prisma.TransactionClient, actor: AuditActor, entry: AuditEntry) {
  await tx.registroAuditoria.create({ data: {
    administradorId: actor.id, administradorEmail: actor.email,
    acao: entry.acao, recurso: entry.recurso, registroId: String(entry.registroId),
    resumo: entry.resumo, detalhes: entry.detalhes ?? {},
  } })
}

export function changedFields(before: object, after: object, fields: readonly string[]) {
  const previous = before as Record<string, unknown>, next = after as Record<string, unknown>
  return fields.filter(field => JSON.stringify(previous[field]) !== JSON.stringify(next[field]))
}

type Editorial = { id: string | number; titulo: string; status: string }
export async function auditEditorial(tx: Prisma.TransactionClient, actor: AuditActor, recurso: RecursoAuditoria,
  after: Editorial, fields: readonly string[], before?: Editorial | null) {
  const acao = !before ? 'CRIAR' : before.status !== after.status && after.status === 'PUBLICADO' ? 'PUBLICAR'
    : before.status !== after.status && after.status === 'ARQUIVADO' ? 'ARQUIVAR' : 'EDITAR'
  await recordAudit(tx, actor, {
    acao, recurso, registroId: after.id, resumo: `${acao}: ${after.titulo}`,
    detalhes: {
      camposAlterados: changedFields(before ?? {}, after, fields),
      statusAnterior: before?.status ?? null, statusAtual: after.status,
    },
  })
}

export function auditFilters(query: Record<string, unknown>) {
  v.keys(query, ['page', 'pageSize', 'acao', 'recurso', 'registroId', 'administradorId', 'inicio', 'fim'])
  const pagination = parsePagination(query, 20) ?? { page: 1, pageSize: 20 }
  const where: Prisma.RegistroAuditoriaWhereInput = {}
  if (query.acao !== undefined) {
    const acao = v.text(query.acao, 'acao', 30)
    if (!Object.values(AcaoAuditoria).includes(acao as AcaoAuditoria)) throw new ValidationError('Ação de auditoria inválida.')
    where.acao = acao as AcaoAuditoria
  }
  if (query.recurso !== undefined) {
    const recurso = v.text(query.recurso, 'recurso', 30)
    if (!Object.values(RecursoAuditoria).includes(recurso as RecursoAuditoria)) throw new ValidationError('Recurso de auditoria inválido.')
    where.recurso = recurso as RecursoAuditoria
  }
  if (query.registroId !== undefined) where.registroId = v.text(query.registroId, 'registroId', 100)
  if (query.administradorId !== undefined) where.administradorId = v.text(query.administradorId, 'administradorId', 100)
  const inicio = query.inicio === undefined ? undefined : v.date(query.inicio, 'inicio')
  const fim = query.fim === undefined ? undefined : v.date(query.fim, 'fim')
  if (inicio && fim && fim < inicio) throw new ValidationError('fim não pode preceder inicio.')
  if (inicio || fim) where.criadoEm = { ...(inicio && { gte: inicio }), ...(fim && { lte: fim }) }
  return { ...pagination, where }
}

export async function listAudit(query: Record<string, unknown>) {
  const { page, pageSize, where } = auditFilters(query)
  return prisma.$transaction(async tx => {
    const total = await tx.registroAuditoria.count({ where })
    const totalPages = Math.max(1, Math.ceil(total / pageSize))
    const current = Math.min(page, totalPages)
    const items = await tx.registroAuditoria.findMany({ where, skip: (current - 1) * pageSize, take: pageSize,
      orderBy: [{ criadoEm: 'desc' }, { id: 'desc' }] })
    return { items, total, page: current, pageSize, totalPages }
  }, { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead })
}
