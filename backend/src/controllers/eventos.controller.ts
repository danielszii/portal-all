import { Request, Response, NextFunction } from 'express'
import { eventosService } from '../services/eventos.service.js'

export const getEventos = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tipo = typeof req.query.tipo === 'string' ? req.query.tipo : undefined
    const eventos = await eventosService.getAll(tipo)
    res.json(eventos)
  } catch (error) {
    next(error)
  }
}

export const getEventoPorId = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const idParam = req.params.id
    const id = Array.isArray(idParam) ? idParam[0] : idParam

    if (!id) {
      res.status(400).json({ error: 'ID do evento não informado.' })
      return
    }

    const evento = await eventosService.getById(id)
    res.json(evento)
  } catch (error) {
    next(error)
  }
}

export const getGaleria = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const galeria = await eventosService.getGaleria()
    res.json(galeria)
  } catch (error) {
    next(error)
  }
}
