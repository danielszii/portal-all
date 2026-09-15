import { Router } from 'express'
import { getNoticias, getNoticiaPorId } from '../controllers/noticias.controller.js'

const router = Router()

router.get('/', getNoticias)
router.get('/:id', getNoticiaPorId)

export default router
