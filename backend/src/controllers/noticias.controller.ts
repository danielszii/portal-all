import { Request, Response, NextFunction } from 'express'
import { noticiasService } from '../services/noticias.service.js'

export const getNoticias = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const categoria = typeof req.query.categoria === 'string' ? req.query.categoria : undefined
    const search = typeof req.query.q === 'string'
      ? req.query.q
      : typeof req.query.search === 'string'
      ? req.query.search
      : undefined

    const noticias = await noticiasService.getAll(categoria, search)
    res.json(noticias)
  } catch (error) {
    next(error)
  }
}

export const getNoticiaPorId = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const idParam = req.params.id
    const idStr = Array.isArray(idParam) ? idParam[0] : idParam
    const id = parseInt(idStr || '', 10)

    if (isNaN(id)) {
      res.status(400).json({ error: 'ID inválido fornecido.' })
      return
    }

    const noticia = await noticiasService.getById(id)
    res.json(noticia)
  } catch (error) {
    next(error)
  }
}
