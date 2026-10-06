import { Prisma } from '@prisma/client'
import { prisma } from '../db/prisma.js'
import { AppError, ValidationError } from '../errors/app.error.js'
import { foldSearch, parsePagination } from '../repositories/catalog-query.js'
import { deleteRecord } from '../repositories/admin-delete.repository.js'
import type { AuditActor } from './admin-audit.service.js'
import * as v from './admin-validation.js'

export async function listPeople(resource: 'academicos' | 'patronos', query: Record<string, unknown>) {
  const { page, pageSize } = parsePagination(query, 20) ?? { page: 1, pageSize: 20 }
  if (query.semVinculos !== undefined && query.semVinculos !== 'true' && query.semVinculos !== 'false') {
    throw new ValidationError('semVinculos deve ser true ou false.')
  }
  const q = query.q === undefined ? '' : v.optionalText(query.q, 'q', 200) ?? ''
  const nome = q ? { contains: q.replace(/[\\%_]/g, '\\$&'), mode: 'insensitive' as const } : undefined
  const unlinked = query.semVinculos === 'true'
  const academics: Prisma.AcademicoWhereInput = { nome, ...(unlinked ? {
    ocupacoes: { none: {} }, obras: { none: {} }, producoes: { none: {} }, autorias: { none: {} }, mandatos: { none: {} },
  } : {}) }
  const patrons: Prisma.PatronoWhereInput = { nome, ...(unlinked ? { cadeiras: { none: {} } } : {}) }
  return prisma.$transaction(async tx => {
    const total = resource === 'academicos'
      ? await tx.academico.count({ where: academics }) : await tx.patrono.count({ where: patrons })
    const totalPages = Math.max(1, Math.ceil(total / pageSize))
    const current = Math.min(page, totalPages)
    const args = { skip: (current - 1) * pageSize, take: pageSize, orderBy: [{ nome: 'asc' as const }, { id: 'asc' as const }] }
    const items = resource === 'academicos'
      ? await tx.academico.findMany({ ...args, where: academics }) : await tx.patrono.findMany({ ...args, where: patrons })
    return { items, total, page: current, pageSize, totalPages }
  }, { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead })
}

export type PersonRole = 'academico' | 'fundador' | 'patrono'
export const normalizePersonName = (name: string) => foldSearch(name.trim().replace(/\s+/gu, ' '))

export async function deletePerson(resource: 'academicos' | 'patronos', id: string, actor: AuditActor) {
  // RESTRICT protege todos os vínculos, inclusive os criados simultaneamente.
  await deleteRecord(resource === 'academicos' ? 'Academico' : 'Patrono', id, actor)
}

export class PersonConflict extends AppError {
  constructor(public readonly role: PersonRole, public readonly candidates: { id: string; nome: string; descricao: string }[]) {
    super('Já existem pessoas com este nome. Selecione o cadastro correto ou confirme que é outra pessoa.', 409)
  }
}

export function confirmedHomonyms(value: unknown): PersonRole[] {
  if (value === undefined) return []
  if (!Array.isArray(value) || value.length > 3 || value.some(role => !['academico', 'fundador', 'patrono'].includes(role))) {
    throw new ValidationError('Confirmação de homônimos inválida.')
  }
  return value as PersonRole[]
}

export async function lockPersonNames(tx: Prisma.TransactionClient, names: { role: PersonRole; nome: string }[]) {
  // Todas as reservas seguem a mesma ordem, inclusive entre cadeiras diferentes.
  const keys = [...new Set(names.map(p => `${p.role === 'patrono' ? 'patrono' : 'academico'}:${normalizePersonName(p.nome)}`))].sort()
  for (const key of keys) await tx.$executeRaw`SELECT pg_advisory_xact_lock(230924, hashtext(${key}))`
}

export async function checkPersonName(tx: Prisma.TransactionClient, role: PersonRole, name: string, confirmations: PersonRole[]) {
  if (confirmations.includes(role)) return
  // Busca só identificadores e nomes; biografias são lidas apenas dos candidatos.
  const names = role === 'patrono'
    ? await tx.patrono.findMany({ select: { id: true, nome: true } })
    : await tx.academico.findMany({ select: { id: true, nome: true } })
  const ids = names.filter(p => normalizePersonName(p.nome) === normalizePersonName(name)).map(p => p.id)
  if (!ids.length) return
  const candidates = role === 'patrono'
    ? (await tx.patrono.findMany({ where: { id: { in: ids } }, include: { cadeiras: { select: { numero: true } } }, orderBy: { id: 'asc' } }))
      .map(p => ({ id: p.id, nome: p.nome, descricao: [p.biografia?.slice(0, 300), p.cadeiras.map(c => `Cadeira ${c.numero}`).join(', ')].filter(Boolean).join(' · ') }))
    : (await tx.academico.findMany({ where: { id: { in: ids } }, include: { ocupacoes: { include: { cadeira: { select: { numero: true } } } } }, orderBy: { id: 'asc' } }))
      .map(p => ({ id: p.id, nome: p.nome, descricao: [p.biografia?.slice(0, 300), p.inMemoriam ? 'In memoriam' : '',
        p.ocupacoes.map(o => `Cadeira ${o.cadeira.numero}${o.vigente ? ' (titular atual)' : ' (histórico)'}`).join(', ')].filter(Boolean).join(' · ') }))
  throw new PersonConflict(role, candidates)
}
