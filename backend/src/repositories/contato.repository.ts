import { ContatoMensagem } from '../types/index.js'

export interface IContatoRepository {
  create(mensagem: ContatoMensagem): Promise<ContatoMensagem>
  findAll(): Promise<ContatoMensagem[]>
}

export class MemoryContatoRepository implements IContatoRepository {
  private mensagens: ContatoMensagem[] = []

  async create(mensagem: ContatoMensagem): Promise<ContatoMensagem> {
    this.mensagens.push(mensagem)
    return mensagem
  }

  async findAll(): Promise<ContatoMensagem[]> {
    return [...this.mensagens]
  }
}

export const contatoRepository = new MemoryContatoRepository()
