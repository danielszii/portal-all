import { Router } from 'express'
import { postContato } from '../controllers/contato.controller.js'

const router = Router()

router.post('/', postContato)
// Leitura desativada até existir autenticação administrativa.

export default router
