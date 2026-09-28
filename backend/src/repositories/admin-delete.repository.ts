import { Prisma } from '@prisma/client'
import { prisma } from '../db/prisma.js'
import { AppError } from '../errors/app.error.js'
import { recordAudit, type AuditActor } from '../services/admin-audit.service.js'

const tables = {
  Noticia: Prisma.sql`"Noticia"`, AcervoItem: Prisma.sql`"AcervoItem"`, Evento: Prisma.sql`"Evento"`,
  Academico: Prisma.sql`"Academico"`, Patrono: Prisma.sql`"Patrono"`, GaleriaFoto: Prisma.sql`"GaleriaFoto"`,
} as const
const resources = { Noticia: 'NOTICIA', AcervoItem: 'ACERVO', Evento: 'EVENTO', Academico: 'ACADEMICO', Patrono: 'PATRONO', GaleriaFoto: 'GALERIA' } as const

export async function deleteRecord(table: keyof typeof tables, id: string | number, actor: AuditActor, db?: Prisma.TransactionClient): Promise<void> {
  if (!db) return prisma.$transaction(tx => deleteRecord(table, id, actor, tx))
  try {
    // Identificadores são constantes; o ID é um parâmetro. executeRaw preserva
    // o SQLSTATE do PostgreSQL 18, inclusive RESTRICT (23001), no Prisma 5.
    const count = await db.$executeRaw(Prisma.sql`DELETE FROM ${tables[table]} WHERE "id" = ${id}`)
    if (count === 0) throw new AppError('Registro não encontrado.', 404)
    await recordAudit(db, actor, { acao: 'EXCLUIR', recurso: resources[table], registroId: id, resumo: `${resources[table]} excluído.` })
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError
      && error.code === 'P2010' && ['23001', '23503'].includes(String(error.meta?.code))) {
      throw new AppError('Este registro possui vínculos com outros dados e não pode ser excluído. Os vínculos e o histórico foram preservados.', 409)
    }
    throw error
  }
}
