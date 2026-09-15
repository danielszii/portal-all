import { INoticiasRepository, noticiasRepository } from '../repositories/noticias.repository.js'
import { Noticia } from '../types/index.js'
import { NotFoundError } from '../errors/app.error.js'

export class NoticiasService {
  constructor(private repo: INoticiasRepository = noticiasRepository) {}

  async getAll(categoria?: string, search?: string): Promise<Noticia[]> {
    return this.repo.findAll(categoria, search)
  }

  async getById(id: number): Promise<Noticia> {
    const noticia = await this.repo.findById(id)
    if (!noticia) {
      throw new NotFoundError(`Notícia ${id} não encontrada.`)
    }
    return noticia
  }
}

export const noticiasService = new NoticiasService()
