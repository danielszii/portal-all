import { CorsOptions } from 'cors'
import { envConfig } from './env.config.js'

export const corsConfig: CorsOptions = {
  origin: envConfig.frontendUrl || '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}
