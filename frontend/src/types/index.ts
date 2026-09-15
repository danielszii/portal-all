export type Obra = {
  titulo: string
  ano?: string
  tipo?: string
}

export type Sucessor = {
  nome: string
  periodo: string
  status: 'Titular' | 'In memoriam' | 'Emérito'
}

export type ProducaoLiteraria = {
  titulo: string
  tipo: 'Poema' | 'Crônica' | 'Conto' | 'Artigo'
  texto: string
}

export type Cadeira = {
  number: string
  patron: string
  founder: string
  holder: string
  image: string
  status: string
  bio?: string
  bioExtra?: string
  posse?: string
  obras?: Obra[]
  patronoBio?: string
  sucessao?: Sucessor[]
  producao?: ProducaoLiteraria[]
}

export type Evento = {
  id: string
  titulo: string
  tipo: 'Sessão Solene' | 'Posse' | 'Palestra' | 'Lançamento' | 'Sarau' | 'Reunião'
  data: string
  hora: string
  local: string
  descricao: string
  foto?: string
  passado?: boolean
}

export type GaleriaFoto = {
  src: string
  legenda: string
}

export type Noticia = {
  id: number
  data: string
  categoria: string
  titulo: string
  lede: string
  img: string
  conteudo?: string
}

export type AcervoItem = {
  title: string
  tomo: string
  year: string
  color: string
  author: string
  type: string
  pages: string
  desc: string
  pdf: string
}

export type ContatoForm = {
  nome: string
  email: string
  assunto: string
  mensagem: string
}
