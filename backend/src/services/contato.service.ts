import { IContatoRepository, contatoRepository } from '../repositories/contato.repository.js'
import { ContatoMensagem } from '../types/index.js'
import { CriarContatoDTO, ContatoRespostaDTO } from '../dtos/contato.dto.js'
import { ValidationError } from '../errors/app.error.js'

export class ContatoService {
  constructor(private repo: IContatoRepository = contatoRepository) {}

  async salvarMensagem(dados: CriarContatoDTO): Promise<ContatoRespostaDTO> {
    if (!dados.nome || !dados.email || !dados.mensagem) {
      throw new ValidationError('Campos obrigatórios ausentes (nome, email, mensagem).')
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(dados.email)) {
      throw new ValidationError('O e-mail informado é inválido.')
    }

    const id = `msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`
    const novaMensagem: ContatoMensagem = {
      ...dados,
      assunto: dados.assunto || 'Geral',
      id,
      dataEnvio: new Date().toISOString()
    }

    await this.repo.create(novaMensagem)

    return {
      sucesso: true,
      mensagem: 'Sua mensagem foi recebida com sucesso pela Academia Limoeirense de Letras.',
      id
    }
  }

  async getMensagens(): Promise<ContatoMensagem[]> {
    return this.repo.findAll()
  }
}

export const contatoService = new ContatoService()
