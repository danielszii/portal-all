import { Router } from 'express'
import cadeirasRouter from './cadeiras.routes.js'
import eventosRouter from './eventos.routes.js'
import noticiasRouter from './noticias.routes.js'
import acervoRouter from './acervo.routes.js'
import contatoRouter from './contato.routes.js'

const apiRouter = Router()

// Health check
apiRouter.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    instituicao: 'Academia Limoeirense de Letras (A.L.L.)',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  })
})

// Sub-rotas
apiRouter.use('/cadeiras', cadeirasRouter)
apiRouter.use('/eventos', eventosRouter)
apiRouter.use('/noticias', noticiasRouter)
apiRouter.use('/acervo', acervoRouter)
apiRouter.use('/contato', contatoRouter)

export default apiRouter
