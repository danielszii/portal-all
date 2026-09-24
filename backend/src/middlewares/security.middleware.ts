import type { RequestHandler } from 'express'

// Compatível com as fontes externas e o visualizador de PDF usados pelo portal.
const policy = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com",
  "img-src 'self' data: blob: https: http:",
  "connect-src 'self'",
  "frame-src 'self' https://docs.google.com",
  "object-src 'none'",
  "base-uri 'none'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join('; ')

export const securityHeaders: RequestHandler = (_req, res, next) => {
  res.setHeader('Content-Security-Policy', policy)
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('X-Frame-Options', 'DENY')
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
  next()
}

export const validateSearch: RequestHandler = (req, res, next) => {
  for (const key of ['q', 'search', 'categoria', 'tipo']) {
    const value = req.query[key]
    if (value !== undefined && (typeof value !== 'string' || value.length > 200)) {
      res.status(400).json({ error: 'Filtros devem ser textos de até 200 caracteres.' })
      return
    }
  }
  next()
}
