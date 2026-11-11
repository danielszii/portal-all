import { Request, Response, NextFunction } from 'express'
import { acervoService } from '../services/acervo.service.js'
import { parsePagination } from '../repositories/catalog-query.js'
import { prisma } from '../db/prisma.js'

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

export const getBiblioteca = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page, pageSize } = parsePagination(req.query) ?? { page: 1, pageSize: 20 }
    const q = typeof req.query.q === 'string' ? req.query.q.trim().slice(0, 200) : ''
    const term = { contains: q.replace(/[\\%_]/g, '\\$&'), mode: 'insensitive' as const }
    const where = { status: 'PUBLICADO' as const, ...(q ? { OR: [
      { titulo: term }, { autor: term }, { editora: term }, { tombo: term },
    ] } : {}) }
    const total = await prisma.livroBiblioteca.count({ where })
    const totalPages = Math.max(1, Math.ceil(total / pageSize))
    const current = Math.min(page, totalPages)
    const items = await prisma.livroBiblioteca.findMany({ where, skip: (current - 1) * pageSize, take: pageSize,
      select: { id: true, titulo: true, autor: true, editora: true, ano: true, tombo: true, localizacao: true, quantidade: true, observacoes: true },
      orderBy: [{ titulo: 'asc' }, { autor: 'asc' }, { id: 'asc' }] })
    res.json({ items, total, page: current, pageSize, totalPages })
  } catch (error) { next(error) }
}
