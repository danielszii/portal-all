import { Request, Response, NextFunction } from 'express'
import { AppError } from '../errors/app.error.js'

export const errorHandler = (
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
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
