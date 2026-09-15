import { Router } from 'express'
import { getAcervo } from '../controllers/acervo.controller.js'

const router = Router()

router.get('/', getAcervo)

export default router
