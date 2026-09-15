import { Router } from 'express'
import { getCadeiras, getCadeiraPorNumero } from '../controllers/cadeiras.controller.js'

const router = Router()

router.get('/', getCadeiras)
router.get('/:numero', getCadeiraPorNumero)

export default router
