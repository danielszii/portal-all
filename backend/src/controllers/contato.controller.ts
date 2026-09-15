import { Request, Response, NextFunction } from 'express'
import { contatoService } from '../services/contato.service.js'

export const postContato = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { nome, email, assunto, mensagem } = req.body

    const resultado = await contatoService.salvarMensagem({
      nome,
      email,
      assunto,
      mensagem,
    })

    res.status(201).json(resultado)
  } catch (error) {
    next(error)
  }
}

export const getMensagens = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const mensagens = await contatoService.getMensagens()
    res.json(mensagens)
  } catch (error) {
    next(error)
  }
}
