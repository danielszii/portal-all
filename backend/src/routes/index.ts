import { Router } from 'express'
import cadeirasRouter from './cadeiras.routes.js'
import eventosRouter from './eventos.routes.js'
import noticiasRouter from './noticias.routes.js'
import acervoRouter from './acervo.routes.js'
import contatoRouter from './contato.routes.js'
import { findInstituicao } from '../repositories/instituicao.repository.js'
import inicioRouter from './inicio.routes.js'
import { databaseReady } from '../services/readiness.service.js'

const apiRouter = Router()

apiRouter.get('/instituicao', async (_req, res, next) => {
  try {
    res.json(await findInstituicao())
  } catch (error) { next(error) }
})

// Health check
apiRouter.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    instituicao: 'Academia Limoeirense de Letras (A.L.L.)',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  })
})

// Disponibilidade para receber tráfego; /health permanece como verificação do processo.
apiRouter.get('/ready', async (_req, res) => {
  const ready = await databaseReady()
  res.setHeader('Cache-Control', 'no-store')
  res.status(ready ? 200 : 503).json({
    status: ready ? 'ok' : 'unavailable',
    database: ready ? 'up' : 'down',
  })
})

// Sub-rotas
apiRouter.use('/inicio', inicioRouter)
apiRouter.use('/cadeiras', cadeirasRouter)
apiRouter.use('/eventos', eventosRouter)
apiRouter.use('/noticias', noticiasRouter)
apiRouter.use('/acervo', acervoRouter)
apiRouter.use('/contato', contatoRouter)

export default apiRouter
