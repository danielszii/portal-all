import { IEventosRepository, eventosRepository } from '../repositories/eventos.repository.js'
import { Evento, GaleriaFoto } from '../types/index.js'
import { NotFoundError } from '../errors/app.error.js'

export class EventosService {
  constructor(private repo: IEventosRepository = eventosRepository) {}

  async getAll(tipo?: string): Promise<Evento[]> {
    return this.repo.findAll({ tipo })
  }

  async getById(id: string): Promise<Evento> {
    const evento = await this.repo.findById(id)
    if (!evento) {
      throw new NotFoundError(`Evento ${id} não encontrado.`)
    }
    return evento
  }

  async getGaleria(): Promise<GaleriaFoto[]> {
    return this.repo.findGaleria()
  }
}

export const eventosService = new EventosService()
