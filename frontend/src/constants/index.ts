export const FILTROS_CADEIRAS = [
  'Todos',
  'Titular em exercício',
  'In memoriam',
  'Vaga',
] as const

export const TIPOS_EVENTOS = [
  'Todos',
  'Sessão Solene',
  'Posse',
  'Palestra',
  'Lançamento',
  'Sarau',
] as const

export const CATEGORIAS_NOTICIAS = [
  'Todas',
  'Institucional',
  'Publicações',
  'Acervo',
  'Eventos',
] as const

export const TIPOS_ACERVO = [
  'Todos',
  'Caderno',
  'Antologia',
  'Revista',
  'Livro',
  'Discurso',
  'Estatuto',
] as const

export const EVENTO_TIPO_COR: Record<string, string> = {
  'Sessão Solene': 'navy',
  'Posse': 'bronze',
  'Palestra': 'ink',
  'Lançamento': 'ochre',
  'Sarau': 'green',
  'Reunião': 'ink',
}
