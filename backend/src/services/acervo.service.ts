import { IAcervoRepository, acervoRepository } from '../repositories/acervo.repository.js'
import { AcervoItem } from '../types/index.js'
import type { Pagination } from '../repositories/catalog-query.js'
import { NotFoundError } from '../errors/app.error.js'

export class AcervoService {
  constructor(private repo: IAcervoRepository = acervoRepository) {}

  async getAll(tipo?: string, search?: string): Promise<AcervoItem[]> {
    return this.repo.findAll(tipo, search)
  }
  getPage(pagination: Pagination, tipo?: string, search?: string) { return this.repo.findPage(pagination, tipo, search) }
  async getById(id: string) {
    const item = await this.repo.findById(id)
    if (!item) throw new NotFoundError('Publicação não encontrada.')
    return item
  }
}

export const acervoService = new AcervoService()
