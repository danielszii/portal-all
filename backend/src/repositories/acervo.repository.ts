import { acervoData } from '../data/acervo.data.js'
import { AcervoItem } from '../types/index.js'

export interface IAcervoRepository {
  findAll(tipo?: string, search?: string): Promise<AcervoItem[]>
}

export class MemoryAcervoRepository implements IAcervoRepository {
  private items: AcervoItem[] = [...acervoData]

  async findAll(tipo?: string, search?: string): Promise<AcervoItem[]> {
    let result = [...this.items]

    if (tipo && tipo !== 'Todos') {
      result = result.filter(item => item.type.toLowerCase() === tipo.toLowerCase())
    }

    if (search) {
      const q = search.toLowerCase()
      result = result.filter(item =>
        item.title.toLowerCase().includes(q) ||
        item.author.toLowerCase().includes(q) ||
        item.desc.toLowerCase().includes(q) ||
        item.tomo.toLowerCase().includes(q)
      )
    }

    return result
  }
}

export const acervoRepository = new MemoryAcervoRepository()
