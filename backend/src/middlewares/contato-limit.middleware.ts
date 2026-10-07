import type { RequestHandler } from 'express'
import ipaddr from 'ipaddr.js'

function clientKey(value: string) {
  if (!ipaddr.isValid(value)) return 'unknown'
  const address = ipaddr.process(value)
  if (address.kind() === 'ipv4') return address.toString()
  // Endereços temporários da mesma rede IPv6 não ganham cotas independentes.
  const bytes = address.toByteArray()
  bytes.fill(0, 8)
  return ipaddr.fromByteArray(bytes).toString() + '/64'
}

// Proteção local ao processo. Não confia em X-Forwarded-For enviado pelo cliente.
export function createRequestLimit({ limit = 5, windowMs = 15 * 60_000, maxEntries = 10_000, now = Date.now, skipSuccessfulRequests = false } = {}): RequestHandler {
  const entries = new Map<string, { count: number; expires: number }>()
  let nextCleanup = 0
  return (req, res, next) => {
    const time = now()
    if (time >= nextCleanup) {
      for (const [key, entry] of entries) if (entry.expires <= time) entries.delete(key)
      nextCleanup = time + Math.min(windowMs, 60_000)
    }
    const key = clientKey(req.ip ?? req.socket.remoteAddress ?? 'unknown')
    let entry = entries.get(key)
    if (entry && entry.expires <= time) { entries.delete(key); entry = undefined }
    if ((!entry && entries.size >= maxEntries) || (entry && entry.count >= limit)) {
      res.setHeader('Retry-After', Math.max(1, Math.ceil(((entry?.expires ?? nextCleanup) - time) / 1000)))
      res.status(429).json({ error: 'Muitas requisições. Aguarde e tente novamente.' })
      return
    }
    if (!entry) { entry = { count: 0, expires: time + windowMs }; entries.set(key, entry) }
    entry.count++
    if (skipSuccessfulRequests) {
      const countedEntry = entry
      res.once('finish', () => {
        if (res.statusCode < 400) countedEntry.count = Math.max(0, countedEntry.count - 1)
      })
    }
    next()
  }
}

export const createContatoLimit = createRequestLimit
