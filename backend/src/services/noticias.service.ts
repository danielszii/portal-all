import { INoticiasRepository, noticiasRepository } from '../repositories/noticias.repository.js'
import { Noticia } from '../types/index.js'
import { NotFoundError } from '../errors/app.error.js'
import type { Pagination } from '../repositories/catalog-query.js'

export class NoticiasService {
  constructor(private repo: INoticiasRepository = noticiasRepository) {}

  async getAll(categoria?: string, search?: string, resumo = false): Promise<Noticia[]> {
    return this.repo.findAll(categoria, search, resumo)
  }

  async getById(id: number): Promise<Noticia> {
    const noticia = await this.repo.findById(id)
    if (!noticia) {
      throw new NotFoundError(`Notícia ${id} não encontrada.`)
    }
    return noticia
  }
  getPage(pagination: Pagination, categoria?: string, search?: string, resumo = false) {
    return this.repo.findPage(pagination, categoria, search, resumo)
  }
}

export const noticiasService = new NoticiasService()
