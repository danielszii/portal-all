import { Request, Response, NextFunction } from 'express'

export const requestLogger = (req: Request, _res: Response, next: NextFunction): void => {
  const timestamp = new Date().toISOString()
  console.log(`[${timestamp}] ${req.method} ${req.originalUrl || req.url}`)
  next()
}
