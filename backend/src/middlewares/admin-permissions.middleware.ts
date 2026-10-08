import type { RequestHandler } from 'express'
import { permissionForRequest, permissionsFor } from '../domain/admin-permissions.js'
import { AppError } from '../errors/app.error.js'

export const requireAdminPermission: RequestHandler = (req, res, next) => {
  const permission = permissionForRequest(req.method, req.path, req.get('content-type'))
  if (!permission || !permissionsFor(res.locals.adminSession?.administrador?.perfis).includes(permission)) {
    next(new AppError('Seu perfil não tem permissão para esta operação.', 403))
    return
  }
  next()
}
