import { Request, Response, NextFunction } from 'express'
import { cadeirasService } from '../services/cadeiras.service.js'
import type { Cadeira } from '../types/index.js'

const categorias = ['Titular', 'Correspondente', 'Honorário', 'In Memoriam', 'Vaga'] as const satisfies readonly NonNullable<Cadeira['category']>[]

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

    const category = typeof req.query.categoria === 'string' && categorias.includes(req.query.categoria as typeof categorias[number])
      ? req.query.categoria as typeof categorias[number]
      : undefined
    if (typeof req.query.categoria === 'string' && !category) {
      res.status(400).json({ error: 'Categoria de membro inválida.' })
      return
    }
    const cadeira = await cadeirasService.getByNumber(numero, category)
    res.json(cadeira)
  } catch (error) {
    next(error)
  }
}
