import { prisma } from '../db/prisma.js'
import type { Noticia } from '../types/index.js'
import { mapNoticia } from './mappers.js'
import { queryCatalog, type Pagination, type Page } from './catalog-query.js'
type Row = Parameters<typeof mapNoticia>[0]
export interface INoticiasRepository {
  findAll(categoria?: string, search?: string, resumo?: boolean): Promise<Noticia[]>
  findById(id: number): Promise<Noticia | null>
  findPage(pagination: Pagination, categoria?: string, search?: string, resumo?: boolean): Promise<Page<Noticia>>
}
export class PrismaNoticiasRepository implements INoticiasRepository {
  async findAll(categoria?: string, search?: string, resumo = false): Promise<Noticia[]> {
    if (search?.trim() || categoria && categoria !== 'Todas') {
      return (await queryCatalog<Row>('Noticia', { filter: categoria, search, summary: resumo })).items.map(mapNoticia)
    }
    return (await prisma.noticia.findMany({ where: {
      status: 'PUBLICADO', publicadoEm: { lte: new Date() },
    }, select: { id: true, categoria: true, titulo: true, lede: true, img: true, publicadoEm: true, conteudo: !resumo },
    orderBy: [{ publicadoEm: 'desc' }, { id: 'desc' }] })).map(mapNoticia)
  }
  async findById(id: number): Promise<Noticia | null> {
    const row = await prisma.noticia.findFirst({ where: { id, status: 'PUBLICADO', publicadoEm: { lte: new Date() } } })
    return row ? mapNoticia(row) : null
  }
  async findPage(pagination: Pagination, categoria?: string, search?: string, resumo = false): Promise<Page<Noticia>> {
    const result = await queryCatalog<Row>('Noticia', { pagination, filter: categoria, search, summary: resumo })
    return { ...result, items: result.items.map(mapNoticia) }
  }
}
export const noticiasRepository = new PrismaNoticiasRepository()
