import { Prisma } from '@prisma/client'
import { prisma } from '../db/prisma.js'
import type { Pagination } from '../repositories/catalog-query.js'
import { deleteRecord } from '../repositories/admin-delete.repository.js'
import type { AuditActor } from './admin-audit.service.js'

export async function listGaleria({ page, pageSize }: Pagination, eventoId?: string) {
  const where = eventoId ? { eventoId } : {}
  return prisma.$transaction(async tx => {
    const total = await tx.galeriaFoto.count({ where })
    const totalPages = Math.max(1, Math.ceil(total / pageSize))
    const current = Math.min(page, totalPages)
    const items = await tx.galeriaFoto.findMany({
      where, skip: (current - 1) * pageSize, take: pageSize,
      orderBy: [{ ordem: 'asc' }, { id: 'asc' }],
    })
    return { items, total, page: current, pageSize, totalPages }
  }, { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead })
}

export async function deleteFoto(id: string, actor: AuditActor) {
  // O mesmo arquivo pode ser utilizado por outros conteúdos do portal.
  await deleteRecord('GaleriaFoto', id, actor)
}
