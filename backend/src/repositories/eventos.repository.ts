import { prisma } from '../db/prisma.js'
import type { Evento, GaleriaFoto } from '../types/index.js'
import type { FiltroEventosDTO } from '../dtos/evento.dto.js'
import { mapEvento, mapFoto } from './mappers.js'
export interface IEventosRepository {
  findAll(filters?: FiltroEventosDTO): Promise<Evento[]>
  findById(id: string): Promise<Evento | null>
  findGaleria(): Promise<GaleriaFoto[]>
}
export class PrismaEventosRepository implements IEventosRepository {
  async findAll(filters?: FiltroEventosDTO): Promise<Evento[]> {
    return (await prisma.evento.findMany({ where: { status: 'PUBLICADO', ...(filters?.tipo && filters.tipo !== 'Todos' ? { tipo: { equals: filters.tipo, mode: 'insensitive' as const } } : {}) }, orderBy: { inicioEm: 'asc' } })).map(mapEvento)
  }
  async findById(id: string): Promise<Evento | null> {
    const row = await prisma.evento.findFirst({ where: { id, status: 'PUBLICADO' } })
    return row ? mapEvento(row) : null
  }
  async findGaleria(): Promise<GaleriaFoto[]> {
    return (await prisma.galeriaFoto.findMany({ where: { OR: [{ eventoId: null }, { evento: { status: 'PUBLICADO' } }] }, orderBy: [{ ordem: 'asc' }, { id: 'asc' }] })).map(mapFoto)
  }
}
export const eventosRepository = new PrismaEventosRepository()
