import { Router } from 'express'
import { findInicioAcervo, findInicioCadeiras, findInicioNoticias } from '../repositories/inicio.repository.js'

const router = Router()
for (const [path, load] of [
  ['/cadeiras', findInicioCadeiras], ['/acervo', findInicioAcervo], ['/noticias', findInicioNoticias],
] as const) {
  router.get(path, async (_req, res, next) => {
    try { res.json(await load()) } catch (error) { next(error) }
  })
}
export default router
