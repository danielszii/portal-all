import { Request, Response, NextFunction } from 'express'
import { cadeirasService } from '../services/cadeiras.service.js'

export const getCadeiras = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const status = typeof req.query.status === 'string' ? req.query.status : undefined
    const search = typeof req.query.q === 'string'
      ? req.query.q
      : typeof req.query.search === 'string'
      ? req.query.search
      : undefined

    const cadeiras = await cadeirasService.getAll({ status, search })
    res.json(cadeiras)
  } catch (error) {
    next(error)
  }
}

export const getCadeiraPorNumero = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const numeroParam = req.params.numero
    const numero = Array.isArray(numeroParam) ? numeroParam[0] : numeroParam

    if (!numero) {
      res.status(400).json({ error: 'Número da cadeira não informado.' })
      return
    }

    const cadeira = await cadeirasService.getByNumber(numero)
    res.json(cadeira)
  } catch (error) {
    next(error)
  }
}
