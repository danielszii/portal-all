import { prisma } from '../db/prisma.js'
import { romano } from './mappers.js'
import { queryCatalog, type Pagination } from './catalog-query.js'
import { matchesCadeiraSearch } from './cadeira-search.js'
import { situacaoCadeira } from '../domain/ocupacoes.js'
import type { Cadeira, SearchPage } from '../types/index.js'

export async function findSearchPage(q: string, pagination: Pagination): Promise<SearchPage> {
  if (!q.trim()) return { cadeiras: [], noticias: [], acervo: [], page: 1, totalPages: 1 }
  const [rows, noticias, acervo] = await Promise.all([
    prisma.cadeira.findMany({ orderBy: [{ numero: 'asc' }, { categoria: 'asc' }], select: {
      numero: true, categoria: true, patrono: { select: { nome: true } }, ocupacoes: { select: {
        id: true, fundador: true, vigente: true, inicioAno: true, inicioEm: true, fimAno: true, fimEm: true,
        academico: { select: { nome: true, inMemoriam: true } },
      } },
    } }),
    queryCatalog<{ id: number; titulo: string }>('Noticia', { search: q, pagination, searchSummary: true }),
    queryCatalog<{ id: string; titulo: string; autoriaTexto: string | null }>('AcervoItem', { search: q, pagination, searchSummary: true }),
  ])
  const cadeiras = rows.map(row => {
    const category: Cadeira['category'] = row.categoria === 'CORRESPONDENTE' ? 'Correspondente' : row.categoria === 'HONORARIO' ? 'Honorário' : row.categoria === 'IN_MEMORIAM' ? 'In Memoriam' : row.categoria === 'VAGA' ? 'Vaga' : 'Titular'
    const { membro, ocupacoes } = situacaoCadeira(row.ocupacoes, category === 'In Memoriam')
    return { number: romano(row.numero), category, patron: row.patrono.nome, holder: membro?.nome ?? 'Vaga', founder: ocupacoes.find(o => o.fundador)?.academico.nome ?? '' }
  }).filter(c => matchesCadeiraSearch(c, q))
  const { page, pageSize } = pagination
  return {
    page, totalPages: Math.max(Math.ceil(cadeiras.length / pageSize), noticias.totalPages, acervo.totalPages),
    cadeiras: cadeiras.slice((page - 1) * pageSize, page * pageSize).map(({ number, category, patron, holder }) => ({ number, category, patron, holder })),
    noticias: page > noticias.totalPages ? [] : noticias.items,
    acervo: page > acervo.totalPages ? [] : acervo.items.map(row => ({ id: row.id, title: row.titulo, author: row.autoriaTexto ?? '' })),
  }
}
