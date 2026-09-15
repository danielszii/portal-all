import { IAcervoRepository, acervoRepository } from '../repositories/acervo.repository.js'
import { AcervoItem } from '../types/index.js'

export class AcervoService {
  constructor(private repo: IAcervoRepository = acervoRepository) {}

  async getAll(tipo?: string, search?: string): Promise<AcervoItem[]> {
    return this.repo.findAll(tipo, search)
  }
}

export const acervoService = new AcervoService()
