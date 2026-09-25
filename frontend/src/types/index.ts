// Contrato público único, compartilhado com a API; importação somente de tipos.
export type { Obra, Sucessor, ProducaoLiteraria, Cadeira, Evento, GaleriaFoto, Noticia, AcervoItem, SearchPage } from '../../../backend/src/types/index.js'

export type ContatoForm = {
  nome: string
  email: string
  assunto: string
  mensagem: string
}
