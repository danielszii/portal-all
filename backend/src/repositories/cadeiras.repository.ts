import { prisma } from '../db/prisma.js'
import type { Cadeira } from '../types/index.js'
import type { FiltroCadeirasDTO } from '../dtos/cadeira.dto.js'
import { cadeiraInclude, mapCadeira, numeroCadeira } from './mappers.js'
import { matchesCadeiraSearch } from './cadeira-search.js'
export interface ICadeirasRepository {
  findAll(filters?: FiltroCadeirasDTO): Promise<Cadeira[]>
  findByNumber(number: string): Promise<Cadeira | null>
}
export class PrismaCadeirasRepository implements ICadeirasRepository {
  async findAll(filters?: FiltroCadeirasDTO): Promise<Cadeira[]> {
    const rows = await prisma.cadeira.findMany({ include: cadeiraInclude, orderBy: { numero: 'asc' } })
    return rows.map(mapCadeira).filter(c =>
      (!filters?.status || filters.status === 'Todos' || c.status.toLowerCase() === filters.status.toLowerCase()) &&
      matchesCadeiraSearch(c, filters?.search ?? ''))
  }
  async findByNumber(number: string): Promise<Cadeira | null> {
    const numero = numeroCadeira(number)
    if (!numero) return null
    const row = await prisma.cadeira.findUnique({ where: { numero }, include: cadeiraInclude })
    return row ? mapCadeira(row) : null
  }
}
export const cadeirasRepository = new PrismaCadeirasRepository()
