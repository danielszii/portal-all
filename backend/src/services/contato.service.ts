import { IContatoRepository, contatoRepository } from '../repositories/contato.repository.js'
import { ContatoMensagem } from '../types/index.js'
import { CriarContatoDTO, ContatoRespostaDTO } from '../dtos/contato.dto.js'
import { ValidationError } from '../errors/app.error.js'
import { randomUUID } from 'node:crypto'

function campo(value: unknown, nome: string, max: number): string {
  if (typeof value !== 'string' || !value.trim() || value.trim().length > max) {
    throw new ValidationError(`${nome} deve conter entre 1 e ${max} caracteres.`)
  }
  return value.trim()
}

export class ContatoService {
  constructor(private repo: IContatoRepository = contatoRepository) {}

  async salvarMensagem(dados: CriarContatoDTO): Promise<ContatoRespostaDTO> {
    const nome = campo(dados.nome, 'Nome', 120)
    const email = campo(dados.email, 'E-mail', 254)
    const mensagem = campo(dados.mensagem, 'Mensagem', 5000)
    const assunto = dados.assunto === undefined ? 'Geral' : campo(dados.assunto, 'Assunto', 120)

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      throw new ValidationError('O e-mail informado é inválido.')
    }

    const id = randomUUID()
    const novaMensagem: ContatoMensagem = {
      nome, email, mensagem, assunto,
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
}

export const contatoService = new ContatoService()
