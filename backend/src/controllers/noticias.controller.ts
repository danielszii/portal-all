import { Request, Response, NextFunction } from 'express'
import { noticiasService } from '../services/noticias.service.js'
import { parsePagination } from '../repositories/catalog-query.js'

export const getNoticias = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const categoria = typeof req.query.categoria === 'string' ? req.query.categoria : undefined
    const search = typeof req.query.q === 'string'
      ? req.query.q
      : typeof req.query.search === 'string'
      ? req.query.search
      : undefined

    const pagination = parsePagination(req.query)
    const noticias = pagination
      ? await noticiasService.getPage(pagination, categoria, search, req.query.resumo === 'true')
      : await noticiasService.getAll(categoria, search, req.query.resumo === 'true')
    res.json(noticias)
  } catch (error) {
    next(error)
  }
}

export const getNoticiaPorId = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const idParam = req.params.id
    const idStr = Array.isArray(idParam) ? idParam[0] : idParam
    const id = /^\d+$/.test(idStr || '') ? Number(idStr) : NaN

    if (!Number.isSafeInteger(id) || id < 1) {
      res.status(400).json({ error: 'ID inválido fornecido.' })
      return
    }

    const noticia = await noticiasService.getById(id)
    res.json(noticia)
  } catch (error) {
    next(error)
  }
}
