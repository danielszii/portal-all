import { Prisma } from '@prisma/client'
import { prisma } from '../db/prisma.js'
import { ValidationError } from '../errors/app.error.js'

export type Pagination = { page: number; pageSize: number }
export type Page<T> = Pagination & { items: T[]; total: number; totalPages: number }
export function parsePagination(query: Record<string, unknown>): Pagination | undefined {
  if (query.page === undefined && query.pageSize === undefined) return undefined
  const integer = (value: unknown, fallback: number, max: number) => {
    if (value === undefined) return fallback
    if (typeof value !== 'string' || !/^[1-9]\d*$/.test(value) || !Number.isSafeInteger(Number(value)) || Number(value) > max) {
      throw new ValidationError('Paginação inválida: page deve ser positivo e pageSize deve estar entre 1 e 50.')
    }
    return Number(value)
  }
  return { page: integer(query.page, 1, 2147483647), pageSize: integer(query.pageSize, 12, 50) }
}

export const foldSearch = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
const configs = {
  Noticia: { fields: ['titulo', 'lede', 'conteudo', 'categoria'], filter: 'categoria', order: '"publicadoEm" DESC, "id" DESC' },
  AcervoItem: { fields: ['titulo', 'autoriaTexto', 'descricao', 'edicao', 'categoria', 'ano'], filter: 'categoria', order: '"ano" DESC NULLS LAST, "titulo" ASC, "id" ASC' },
} as const

// Identificadores vêm apenas das constantes acima; termos do usuário são parâmetros.
const foldedColumn = (column: string) => Prisma.sql`lower(regexp_replace(normalize(coalesce(${Prisma.raw('"' + column + '"')}::text, ''), NFD), U&'[\\0300-\\036f]', '', 'g') COLLATE "portal_pt_br")`

export async function queryCatalog<T>(table: keyof typeof configs, options: {
  filter?: string; search?: string; pagination?: Pagination; summary?: boolean; searchSummary?: boolean
}): Promise<Page<T>> {
  const config = configs[table]
  const conditions = [Prisma.sql`"status" = 'PUBLICADO'`]
  if (table === 'Noticia') conditions.push(Prisma.sql`"publicadoEm" <= ${new Date()}`)
  if (options.filter && !['Todos', 'Todas'].includes(options.filter)) {
    conditions.push(Prisma.sql`${foldedColumn(config.filter)} = ${foldSearch(options.filter)}`)
  }
  if (options.search?.trim()) {
    const pattern = '%' + foldSearch(options.search.trim()).replace(/[\\%_]/g, '\\$&') + '%'
    conditions.push(Prisma.sql`(${Prisma.join(config.fields.map(field => Prisma.sql`${foldedColumn(field)} LIKE ${pattern}`), ' OR ')})`)
  }
  const from = Prisma.sql`FROM ${Prisma.raw('"' + table + '"')} WHERE ${Prisma.join(conditions, ' AND ')}`
  const columns = options.searchSummary
    ? Prisma.raw(table === 'Noticia' ? '"id", "titulo"' : '"id", "titulo", "autoriaTexto"')
    : table === 'Noticia' && options.summary
    ? Prisma.raw('"id", "categoria", "titulo", "lede", "img", "publicadoEm"') : Prisma.raw('*')
  return prisma.$transaction(async tx => {
    const [{ total }] = await tx.$queryRaw<{ total: number }[]>(Prisma.sql`SELECT count(*)::int AS total ${from}`)
    const pageSize = options.pagination?.pageSize ?? Math.max(total, 1)
    const totalPages = Math.max(1, Math.ceil(total / pageSize))
    const page = Math.min(options.pagination?.page ?? 1, totalPages)
    const limit = options.pagination ? Prisma.sql`LIMIT ${pageSize} OFFSET ${(page - 1) * pageSize}` : Prisma.empty
    const items = await tx.$queryRaw<T[]>(Prisma.sql`SELECT ${columns} ${from} ORDER BY ${Prisma.raw(config.order)} ${limit}`)
    return { items, total, page, pageSize, totalPages }
  }, { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead })
}
