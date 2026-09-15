import { Router } from 'express'
import { getEventos, getEventoPorId, getGaleria } from '../controllers/eventos.controller.js'

const router = Router()

router.get('/', getEventos)
router.get('/galeria', getGaleria)
router.get('/:id', getEventoPorId)

export default router
