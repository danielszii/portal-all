import { prisma } from '../db/prisma.js'
import type { ContatoMensagem } from '../types/index.js'
export interface IContatoRepository {
  create(mensagem: ContatoMensagem): Promise<ContatoMensagem>
}
export class PrismaContatoRepository implements IContatoRepository {
  async create(mensagem: ContatoMensagem): Promise<ContatoMensagem> {
    const row = await prisma.contatoMensagem.create({ data: {
      id: mensagem.id, nome: mensagem.nome, email: mensagem.email,
      assunto: mensagem.assunto, mensagem: mensagem.mensagem,
    } })
    return { ...row, dataEnvio: row.dataEnvio.toISOString() }
  }
}
export const contatoRepository = new PrismaContatoRepository()
