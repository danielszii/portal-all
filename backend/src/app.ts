import express, { Request, Response } from 'express'
import cors from 'cors'
import { corsConfig } from './config/cors.config.js'
import { requestLogger, errorHandler } from './middlewares/index.js'
import apiRouter from './routes/index.js'
import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

export function createApp(frontendDir = fileURLToPath(new URL('../../frontend/dist/', import.meta.url))) {
  const app = express()

  // Middlewares globais
  app.use(cors(corsConfig))
  app.use(express.json({ limit: '32kb' }))
  app.use(requestLogger)

  // Informações da API não interceptam a página inicial do portal.
  const apiInfo = (_req: Request, res: Response) => {
    res.json({
      instituicao: 'Academia Limoeirense de Letras (A.L.L.)',
      status: 'operacional',
      endpoints: {
        health: '/api/health',
        cadeiras: '/api/cadeiras',
        cadeiraPorNumero: '/api/cadeiras/:numero',
        eventos: '/api/eventos',
        galeria: '/api/eventos/galeria',
        noticias: '/api/noticias',
        acervo: '/api/acervo',
        contato: '/api/contato (POST)',
      },
    })
  }
  app.get('/api', apiInfo)

  // Roteador principal
  app.use('/api', apiRouter)

  if (existsSync(`${frontendDir}/index.html`)) {
    app.use(express.static(frontendDir))
    app.get(/^(?!\/api(?:\/|$)).*/, (_req, res) => res.sendFile(`${frontendDir}/index.html`))
  } else {
    app.get('/', apiInfo)
  }

  // 404 Handler
  app.use((_req: Request, res: Response) => {
    res.status(404).json({
      status: 'error',
      statusCode: 404,
      error: 'Rota não encontrada na API da Academia Limoeirense de Letras.',
    })
  })

  // Middleware global de tratamento de erros
  app.use(errorHandler)

  return app
}

export default createApp()
