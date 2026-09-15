import express, { Request, Response } from 'express'
import cors from 'cors'
import { corsConfig } from './config/cors.config.js'
import { requestLogger, errorHandler } from './middlewares/index.js'
import apiRouter from './routes/index.js'

const app = express()

// Middlewares globais
app.use(cors(corsConfig))
app.use(express.json())
app.use(requestLogger)

// Rota raiz informativa
app.get('/', (_req: Request, res: Response) => {
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
})

// Roteador principal
app.use('/api', apiRouter)

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

export default app
