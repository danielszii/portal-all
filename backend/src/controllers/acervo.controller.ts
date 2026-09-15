import { Request, Response, NextFunction } from 'express'
import { acervoService } from '../services/acervo.service.js'

export const getAcervo = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tipo = typeof req.query.tipo === 'string' ? req.query.tipo : undefined
    const search = typeof req.query.q === 'string'
      ? req.query.q
      : typeof req.query.search === 'string'
      ? req.query.search
      : undefined

    const items = await acervoService.getAll(tipo, search)
    res.json(items)
  } catch (error) {
    next(error)
  }
}
