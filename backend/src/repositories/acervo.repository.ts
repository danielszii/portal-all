import { prisma } from '../db/prisma.js'
import type { AcervoItem } from '../types/index.js'
import { mapAcervo } from './mappers.js'
import { queryCatalog, type Pagination, type Page } from './catalog-query.js'
type Row = Parameters<typeof mapAcervo>[0]
export interface IAcervoRepository {
  findAll(tipo?: string, search?: string): Promise<AcervoItem[]>
  findPage(pagination: Pagination, tipo?: string, search?: string): Promise<Page<AcervoItem>>
  findById(id: string): Promise<AcervoItem | null>
}
export class PrismaAcervoRepository implements IAcervoRepository {
  async findAll(tipo?: string, search?: string): Promise<AcervoItem[]> {
    if (search?.trim() || tipo && tipo !== 'Todos') {
      return (await queryCatalog<Row>('AcervoItem', { filter: tipo, search })).items.map(mapAcervo)
    }
    return (await prisma.acervoItem.findMany({ where: {
      status: 'PUBLICADO',
      ...(tipo && tipo !== 'Todos' ? { categoria: { equals: tipo, mode: 'insensitive' as const } } : {}),
      ...(search?.trim() ? { OR: ['titulo', 'autoriaTexto', 'descricao', 'edicao'].map(key => ({ [key]: { contains: search.trim(), mode: 'insensitive' } })) } : {}),
    }, orderBy: [{ ano: { sort: 'desc', nulls: 'last' } }, { titulo: 'asc' }] })).map(mapAcervo)
  }
  async findPage(pagination: Pagination, tipo?: string, search?: string): Promise<Page<AcervoItem>> {
    const result = await queryCatalog<Row>('AcervoItem', { pagination, filter: tipo, search })
    return { ...result, items: result.items.map(mapAcervo) }
  }
  async findById(id: string): Promise<AcervoItem | null> {
    const row = await prisma.acervoItem.findFirst({ where: { id, status: 'PUBLICADO' } })
    return row ? mapAcervo(row) : null
  }
}
export const acervoRepository = new PrismaAcervoRepository()
