export interface CriarContatoDTO {
  nome: string
  email: string
  assunto?: string
  mensagem: string
}

export interface ContatoRespostaDTO {
  sucesso: boolean
  mensagem: string
  id: string
}
