import { eventosData, galeriaData } from '../data/eventos.data.js'
import { Evento, GaleriaFoto } from '../types/index.js'
import { FiltroEventosDTO } from '../dtos/evento.dto.js'

export interface IEventosRepository {
  findAll(filters?: FiltroEventosDTO): Promise<Evento[]>
  findById(id: string): Promise<Evento | null>
  findGaleria(): Promise<GaleriaFoto[]>
}

export class MemoryEventosRepository implements IEventosRepository {
  private eventos: Evento[] = [...eventosData]
  private galeria: GaleriaFoto[] = [...galeriaData]

  async findAll(filters?: FiltroEventosDTO): Promise<Evento[]> {
    if (filters?.tipo && filters.tipo !== 'Todos') {
      return this.eventos.filter(e => e.tipo.toLowerCase() === filters.tipo!.toLowerCase())
    }
    return this.eventos
  }

  async findById(id: string): Promise<Evento | null> {
    const found = this.eventos.find(e => e.id.toLowerCase() === id.toLowerCase())
    return found || null
  }

  async findGaleria(): Promise<GaleriaFoto[]> {
    return this.galeria
  }
}

export const eventosRepository = new MemoryEventosRepository()
