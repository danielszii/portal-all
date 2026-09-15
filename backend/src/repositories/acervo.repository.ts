import { prisma } from '../db/prisma.js'
import type { AcervoItem } from '../types/index.js'
import { mapAcervo } from './mappers.js'
export interface IAcervoRepository {
  findAll(tipo?: string, search?: string): Promise<AcervoItem[]>
}
export class PrismaAcervoRepository implements IAcervoRepository {
  async findAll(tipo?: string, search?: string): Promise<AcervoItem[]> {
    return (await prisma.acervoItem.findMany({ where: {
      status: 'PUBLICADO',
      ...(tipo && tipo !== 'Todos' ? { categoria: { equals: tipo, mode: 'insensitive' as const } } : {}),
      ...(search?.trim() ? { OR: ['titulo', 'autoriaTexto', 'descricao', 'edicao'].map(key => ({ [key]: { contains: search.trim(), mode: 'insensitive' } })) } : {}),
    }, orderBy: [{ ano: { sort: 'desc', nulls: 'last' } }, { titulo: 'asc' }] })).map(mapAcervo)
  }
}
export const acervoRepository = new PrismaAcervoRepository()
