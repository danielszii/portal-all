import { prisma } from '../db/prisma.js'
import { romano } from './mappers.js'
import { foldSearch, queryCatalog, type Pagination } from './catalog-query.js'
import { situacaoCadeira } from '../domain/ocupacoes.js'
import type { SearchPage } from '../types/index.js'

export async function findSearchPage(q: string, pagination: Pagination): Promise<SearchPage> {
  if (!q.trim()) return { cadeiras: [], noticias: [], acervo: [], page: 1, totalPages: 1 }
  const term = foldSearch(q.trim())
  const [rows, noticias, acervo] = await Promise.all([
    prisma.cadeira.findMany({ orderBy: { numero: 'asc' }, select: {
      numero: true, patrono: { select: { nome: true } }, ocupacoes: { select: {
        id: true, fundador: true, vigente: true, inicioAno: true, inicioEm: true, fimAno: true, fimEm: true,
        academico: { select: { nome: true, inMemoriam: true } },
      } },
    } }),
    queryCatalog<{ id: number; titulo: string }>('Noticia', { search: q, pagination, searchSummary: true }),
    queryCatalog<{ id: string; titulo: string; autoriaTexto: string | null }>('AcervoItem', { search: q, pagination, searchSummary: true }),
  ])
  const cadeiras = rows.map(row => {
    const { membro, ocupacoes } = situacaoCadeira(row.ocupacoes)
    return { number: romano(row.numero), patron: row.patrono.nome, holder: membro?.nome ?? 'Vaga', founder: ocupacoes.find(o => o.fundador)?.academico.nome ?? '' }
  }).filter(c => [c.number, c.patron, c.holder, c.founder].some(value => foldSearch(value).includes(term)))
  const { page, pageSize } = pagination
  return {
    page, totalPages: Math.max(Math.ceil(cadeiras.length / pageSize), noticias.totalPages, acervo.totalPages),
    cadeiras: cadeiras.slice((page - 1) * pageSize, page * pageSize).map(({ number, patron, holder }) => ({ number, patron, holder })),
    noticias: page > noticias.totalPages ? [] : noticias.items,
    acervo: page > acervo.totalPages ? [] : acervo.items.map(row => ({ id: row.id, title: row.titulo, author: row.autoriaTexto ?? '' })),
  }
}
