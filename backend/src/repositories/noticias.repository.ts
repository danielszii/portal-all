import { noticiasData } from '../data/noticias.data.js'
import { Noticia } from '../types/index.js'

export interface INoticiasRepository {
  findAll(categoria?: string, search?: string): Promise<Noticia[]>
  findById(id: number): Promise<Noticia | null>
}

export class MemoryNoticiasRepository implements INoticiasRepository {
  private noticias: Noticia[] = [...noticiasData]

  async findAll(categoria?: string, search?: string): Promise<Noticia[]> {
    let result = [...this.noticias]

    if (categoria && categoria !== 'Todas') {
      result = result.filter(n => n.categoria.toLowerCase() === categoria.toLowerCase())
    }

    if (search) {
      const q = search.toLowerCase()
      result = result.filter(n =>
        n.titulo.toLowerCase().includes(q) ||
        n.lede.toLowerCase().includes(q) ||
        n.categoria.toLowerCase().includes(q)
      )
    }

    return result
  }

  async findById(id: number): Promise<Noticia | null> {
    const found = this.noticias.find(n => n.id === id)
    return found || null
  }
}

export const noticiasRepository = new MemoryNoticiasRepository()
