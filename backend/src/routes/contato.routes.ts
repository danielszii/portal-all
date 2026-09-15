import { Router } from 'express'
import { postContato, getMensagens } from '../controllers/contato.controller.js'

const router = Router()

router.post('/', postContato)
router.get('/', getMensagens)

export default router
