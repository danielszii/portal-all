import app from './app.js'
import { envConfig } from './config/env.config.js'
import { prisma } from './db/prisma.js'

function startSelfPing(): NodeJS.Timeout | undefined {
  const renderUrl = process.env.RENDER_EXTERNAL_URL
  if (!renderUrl) return undefined

  const healthUrl = new URL('/api/health', renderUrl)
  const ping = async () => {
    try {
      const response = await fetch(healthUrl, { signal: AbortSignal.timeout(30000) })
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      await response.body?.cancel()
      console.log('[Self-Ping] API respondeu com sucesso.')
    } catch (error) {
      console.error('[Self-Ping] Falha ao consultar a API:', error)
    }
  }

  void ping()
  return setInterval(() => void ping(), 10 * 60 * 1000)
}

await prisma.$connect()

let selfPingTimer: NodeJS.Timeout | undefined
const server = app.listen(envConfig.port, () => {
  console.log('Portal A.L.L. iniciado')
  console.log('Site:   http://localhost:5173')
  console.log(`API:    http://localhost:${envConfig.port}`)
  console.log(`Status: http://localhost:${envConfig.port}/api/health · ${envConfig.nodeEnv}`)
  selfPingTimer = startSelfPing()
})

process.on('SIGTERM', () => {
  console.log('Encerrando servidor gracefully...')
  if (selfPingTimer) clearInterval(selfPingTimer)
  server.close(async () => {
    await prisma.$disconnect()
    process.exit(0)
  })
})
