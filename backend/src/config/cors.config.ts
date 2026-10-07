import type { CorsOptions } from 'cors'
import { envConfig } from './env.config.js'
import { AppError } from '../errors/app.error.js'

export const corsConfig: CorsOptions = {
  origin(origin, callback) {
    if (origin !== undefined && origin !== envConfig.frontendUrl) {
      callback(new AppError('Origem não autorizada.', 403))
      return
    }
    // Requisições sem Origin continuam sujeitas à autenticação e ao CSRF das rotas.
    callback(null, true)
  },
  credentials: true,
  methods: ['GET', 'HEAD', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
}
