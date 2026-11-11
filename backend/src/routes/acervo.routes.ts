import { Router } from 'express'
import { getAcervo, getAcervoPorId, getBiblioteca } from '../controllers/acervo.controller.js'

const router = Router()

router.get('/', getAcervo)
router.get('/biblioteca', getBiblioteca)
router.get('/:id', getAcervoPorId)

export default router
