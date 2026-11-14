import { prisma } from '../db/prisma.js'
import type { Cadeira } from '../types/index.js'
import type { FiltroCadeirasDTO } from '../dtos/cadeira.dto.js'
import { cadeiraInclude, mapCadeira, numeroCadeira } from './mappers.js'
import { matchesCadeiraSearch } from './cadeira-search.js'
import type { CategoriaCadeira } from '@prisma/client'
export interface ICadeirasRepository {
  findAll(filters?: FiltroCadeirasDTO): Promise<Cadeira[]>
  findByNumber(number: string, category?: Cadeira['category']): Promise<Cadeira | null>
}
function categoryValue(category?: Cadeira['category']): CategoriaCadeira | undefined {
  return category === 'Titular' ? 'TITULAR' : category === 'Correspondente' ? 'CORRESPONDENTE'
    : category === 'Honorário' ? 'HONORARIO' : category === 'In Memoriam' ? 'IN_MEMORIAM'
      : category === 'Vaga' ? 'VAGA' : undefined
}
class PrismaCadeirasRepository implements ICadeirasRepository {
  async findAll(filters?: FiltroCadeirasDTO): Promise<Cadeira[]> {
    const rows = await prisma.cadeira.findMany({ include: cadeiraInclude, orderBy: { numero: 'asc' } })
    return rows.map(mapCadeira).filter(c =>
      (!filters?.status || filters.status === 'Todos' || c.status.toLowerCase() === filters.status.toLowerCase()) &&
      matchesCadeiraSearch(c, filters?.search ?? ''))
  }
  async findByNumber(number: string, category?: Cadeira['category']): Promise<Cadeira | null> {
    const numero = numeroCadeira(number)
    if (!numero) return null
    const categoria = categoryValue(category)
    const row = await prisma.cadeira.findFirst({ where: { numero, ...(categoria ? { categoria } : {}) }, orderBy: { categoria: 'asc' }, include: cadeiraInclude })
    return row ? mapCadeira(row) : null
  }
}
export const cadeirasRepository = new PrismaCadeirasRepository()
