import { Request, Response, NextFunction } from 'express'
import { AppError } from '../errors/app.error.js'

export const errorHandler = (
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  if (err && typeof err === 'object' && 'type' in err) {
    if (err.type === 'entity.parse.failed' || err.type === 'entity.too.large') {
      res.status(err.type === 'entity.too.large' ? 413 : 400).json({ error: err.type === 'entity.too.large' ? 'Mensagem maior que o limite permitido.' : 'Corpo JSON inválido.' })
      return
    }
  }
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      status: 'error',
      statusCode: err.statusCode,
      error: err.message,
    })
    return
  }

  console.error('[ERRO INTERNO]', err)
  res.status(500).json({
    status: 'error',
    statusCode: 500,
    error: 'Ocorreu um erro interno no servidor.',
  })
}
