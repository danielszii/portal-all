import { Router } from 'express'
import { postContato } from '../controllers/contato.controller.js'
import { createContatoLimit } from '../middlewares/contato-limit.middleware.js'

const router = Router()

router.post('/', createContatoLimit(), postContato)
// Leitura desativada até existir autenticação administrativa.

export default router
