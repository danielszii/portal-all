export interface CriarContatoDTO {
  nome: unknown
  email: unknown
  assunto?: unknown
  mensagem: unknown
}

export interface ContatoRespostaDTO {
  sucesso: boolean
  mensagem: string
  id: string
}
