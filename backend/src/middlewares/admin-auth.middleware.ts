import type { RequestHandler, CookieOptions } from 'express'
import { session } from '../services/admin-auth.service.js'
import { AppError } from '../errors/app.error.js'
import { envConfig } from '../config/env.config.js'

export const cookieName = envConfig.nodeEnv === 'production' ? '__Host-portal_admin' : 'portal_admin'
export const cookieOptions: CookieOptions = { httpOnly: true, secure: envConfig.nodeEnv === 'production', sameSite: 'strict', path: '/' }
export const requireOrigin: RequestHandler = (req, _res, next) => {
  if (req.get('origin') !== new URL(envConfig.frontendUrl).origin) return next(new AppError('Origem não autorizada.', 403))
  next()
}
export const requireAdmin: RequestHandler = async (req, res, next) => {
  try {
    const token = (req.headers.cookie ?? '').split(';').map(part => part.trim()).find(part => part.startsWith(cookieName + '='))?.slice(cookieName.length + 1) ?? ''
    const current = await session(token)
    res.locals.adminSession = current
    if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
      if (req.get('origin') !== new URL(envConfig.frontendUrl).origin || req.get('x-csrf-token') !== current.csrfToken) throw new AppError('Verificação CSRF inválida.', 403)
    }
    next()
  } catch (error) { next(error) }
}
