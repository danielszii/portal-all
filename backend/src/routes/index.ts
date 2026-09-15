import { Router } from 'express'
import cadeirasRouter from './cadeiras.routes.js'
import eventosRouter from './eventos.routes.js'
import noticiasRouter from './noticias.routes.js'
import acervoRouter from './acervo.routes.js'
import contatoRouter from './contato.routes.js'
import { prisma } from '../db/prisma.js'

const apiRouter = Router()

apiRouter.get('/instituicao', async (_req, res, next) => {
  try {
    const info = await prisma.instituicao.findUnique({ where: { id: 'all' } })
    const ano = new Date().getFullYear()
    const gestao = await prisma.gestao.findFirst({ where: { inicioAno: { lte: ano }, OR: [{ fimAno: null }, { fimAno: { gte: ano } }] }, orderBy: { inicioAno: 'desc' }, include: { mandatos: { where: { OR: [{ fimEm: null }, { fimEm: { gte: new Date() } }] }, include: { academico: true } } } })
    res.json({ info, gestao: gestao ? { inicioAno: gestao.inicioAno, fimAno: gestao.fimAno, diretoria: gestao.mandatos.map(m => ({ cargo: m.cargo, nome: m.academico.nome, posse: m.inicioEm?.getFullYear().toString() ?? gestao.inicioAno.toString() })) } : null })
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

// Sub-rotas
apiRouter.use('/cadeiras', cadeirasRouter)
apiRouter.use('/eventos', eventosRouter)
apiRouter.use('/noticias', noticiasRouter)
apiRouter.use('/acervo', acervoRouter)
apiRouter.use('/contato', contatoRouter)

export default apiRouter
