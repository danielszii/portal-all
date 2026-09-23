import { Request, Response, NextFunction } from 'express'
import { acervoService } from '../services/acervo.service.js'
import { parsePagination } from '../repositories/catalog-query.js'

export const getAcervo = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tipo = typeof req.query.tipo === 'string' ? req.query.tipo : undefined
    const search = typeof req.query.q === 'string'
      ? req.query.q
      : typeof req.query.search === 'string'
      ? req.query.search
      : undefined

    const pagination = parsePagination(req.query)
    const items = pagination ? await acervoService.getPage(pagination, tipo, search) : await acervoService.getAll(tipo, search)
    res.json(items)
  } catch (error) {
    next(error)
  }
}

export const getAcervoPorId = async (req: Request, res: Response, next: NextFunction) => {
  try { res.json(await acervoService.getById(String(req.params.id))) } catch (error) { next(error) }
}
