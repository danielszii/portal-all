import { prisma } from '../db/prisma.js'
import type { Noticia } from '../types/index.js'
import { mapNoticia } from './mappers.js'
export interface INoticiasRepository {
  findAll(categoria?: string, search?: string): Promise<Noticia[]>
  findById(id: number): Promise<Noticia | null>
}
export class PrismaNoticiasRepository implements INoticiasRepository {
  async findAll(categoria?: string, search?: string): Promise<Noticia[]> {
    return (await prisma.noticia.findMany({ where: {
      status: 'PUBLICADO', publicadoEm: { lte: new Date() },
      ...(categoria && categoria !== 'Todas' ? { categoria: { equals: categoria, mode: 'insensitive' as const } } : {}),
      ...(search?.trim() ? { OR: ['titulo', 'lede', 'conteudo', 'categoria'].map(key => ({ [key]: { contains: search.trim(), mode: 'insensitive' } })) } : {}),
    }, orderBy: [{ publicadoEm: 'desc' }, { id: 'desc' }] })).map(mapNoticia)
  }
  async findById(id: number): Promise<Noticia | null> {
    const row = await prisma.noticia.findFirst({ where: { id, status: 'PUBLICADO', publicadoEm: { lte: new Date() } } })
    return row ? mapNoticia(row) : null
  }
}
export const noticiasRepository = new PrismaNoticiasRepository()
