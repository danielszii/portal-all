import app from './app.js'
import { envConfig } from './config/env.config.js'
import { prisma } from './db/prisma.js'

await prisma.$connect()

const server = app.listen(envConfig.port, () => {
  console.log('Portal A.L.L. iniciado')
  console.log('Site:   http://localhost:5173')
  console.log(`API:    http://localhost:${envConfig.port}`)
  console.log(`Status: http://localhost:${envConfig.port}/api/health · ${envConfig.nodeEnv}`)
})

process.on('SIGTERM', () => {
  console.log('Encerrando servidor gracefully...')
  server.close(async () => {
    await prisma.$disconnect()
    process.exit(0)
  })
})
