import { ICadeirasRepository, cadeirasRepository } from '../repositories/cadeiras.repository.js'
import { Cadeira } from '../types/index.js'
import { FiltroCadeirasDTO } from '../dtos/cadeira.dto.js'
import { NotFoundError } from '../errors/app.error.js'

export class CadeirasService {
  constructor(private repo: ICadeirasRepository = cadeirasRepository) {}

  async getAll(filters?: FiltroCadeirasDTO): Promise<Cadeira[]> {
    return this.repo.findAll(filters)
  }

  async getByNumber(numero: string): Promise<Cadeira> {
    const cadeira = await this.repo.findByNumber(numero)
    if (!cadeira) {
      throw new NotFoundError(`Cadeira ${numero} não encontrada.`)
    }
    return cadeira
  }
}

export const cadeirasService = new CadeirasService()
