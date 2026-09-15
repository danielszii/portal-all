import { cadeirasData } from '../data/cadeiras.data.js'
import { Cadeira } from '../types/index.js'
import { FiltroCadeirasDTO } from '../dtos/cadeira.dto.js'

export interface ICadeirasRepository {
  findAll(filters?: FiltroCadeirasDTO): Promise<Cadeira[]>
  findByNumber(number: string): Promise<Cadeira | null>
}

export class MemoryCadeirasRepository implements ICadeirasRepository {
  private cadeiras: Cadeira[] = [...cadeirasData]

  async findAll(filters?: FiltroCadeirasDTO): Promise<Cadeira[]> {
    let result = [...this.cadeiras]

    if (filters?.status && filters.status !== 'Todos') {
      result = result.filter(c => c.status.toLowerCase() === filters.status!.toLowerCase())
    }

    if (filters?.search) {
      const q = filters.search.toLowerCase()
      result = result.filter(c =>
        c.number.toLowerCase() === q ||
        c.holder.toLowerCase().includes(q) ||
        c.patron.toLowerCase().includes(q) ||
        c.founder.toLowerCase().includes(q)
      )
    }

    return result
  }

  async findByNumber(numero: string): Promise<Cadeira | null> {
    const clean = numero.trim().toUpperCase()
    const found = this.cadeiras.find(c => c.number.toUpperCase() === clean)
    return found || null
  }
}

export const cadeirasRepository = new MemoryCadeirasRepository()
