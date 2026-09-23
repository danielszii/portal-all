import { Router } from 'express'
import { getAcervo, getAcervoPorId } from '../controllers/acervo.controller.js'

const router = Router()

router.get('/', getAcervo)
router.get('/:id', getAcervoPorId)

export default router
