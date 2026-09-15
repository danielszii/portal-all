import app from './app.js'
import { envConfig } from './config/env.config.js'
import { prisma } from './db/prisma.js'

await prisma.$connect()

const server = app.listen(envConfig.port, () => {
  console.log(`🏛️  Servidor da Academia Limoeirense de Letras (A.L.L.) ativo!`)
  console.log(`📡  URL Local: http://localhost:${envConfig.port}`)
  console.log(`🩺  Health Check: http://localhost:${envConfig.port}/api/health`)
  console.log(`🌍  Ambiente: ${envConfig.nodeEnv}`)
})

process.on('SIGTERM', () => {
  console.log('Encerrando servidor gracefully...')
  server.close(async () => {
    await prisma.$disconnect()
    process.exit(0)
  })
})
