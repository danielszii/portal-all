import { Request, Response, NextFunction } from 'express'

export const requestLogger = (req: Request, _res: Response, next: NextFunction): void => {
  const timestamp = new Date().toISOString()
  // Não registra query strings, corpo, cookies ou cabeçalhos de autorização.
  const path = (req.originalUrl || req.url).split('?')[0].replace(/[\r\n\u0000-\u001f\u007f]/g, '')
  console.log(`[${timestamp}] ${req.method} ${path}`)
  next()
}
